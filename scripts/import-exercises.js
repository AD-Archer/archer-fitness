import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// Function to import exercises from JSON file to database
async function importExercisesToDatabase() {
  console.log('Starting exercise import to database...');
  
  try {
    const dataFile = path.join(__dirname, '..', 'data', 'exercisedb-exercises.json');
    
    if (!fs.existsSync(dataFile)) {
      console.error('Exercise data file not found. Please run the scraper first with: npm run scrape:exercises');
      return;
    }

    const rawData = fs.readFileSync(dataFile, 'utf8');
    const data = JSON.parse(rawData);
    
    console.log(`Found ${data.exercises.length} exercises to import...`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const exercise of data.exercises) {
      try {
        // Check if exercise already exists by external ID
        const existing = await prisma.exercise.findFirst({
          where: {
            OR: [
              { name: exercise.name },
              // If we add an externalId field later, we can check by that too
            ]
          }
        });

        if (existing) {
          console.log(`Skipping existing exercise: ${exercise.name}`);
          skipped++;
          continue;
        }

        // Create new exercise
        await prisma.exercise.create({
          data: {
            name: exercise.name,
            description: exercise.description,
            category: exercise.category,
            muscleGroup: exercise.muscleGroup,
            equipment: exercise.equipment,
            instructions: exercise.instructions,
            isPublic: exercise.isPublic,
            isPredefined: exercise.isPredefined,
            userId: null // System/predefined exercises have no user
          }
        });

        imported++;
        
        if (imported % 10 === 0) {
          console.log(`Imported ${imported} exercises...`);
        }

      } catch (error) {
        console.error(`Error importing exercise ${exercise.name}:`, error.message);
        errors++;
      }
    }

    console.log('\n=== Import Summary ===');
    console.log(`Total exercises processed: ${data.exercises.length}`);
    console.log(`Successfully imported: ${imported}`);
    console.log(`Skipped (already exists): ${skipped}`);
    console.log(`Errors: ${errors}`);

  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Function to import sample data for testing
async function importSampleData() {
  console.log('Starting sample data import...');
  
  try {
    const sampleFile = path.join(__dirname, '..', 'data', 'exercisedb-sample.json');
    
    if (!fs.existsSync(sampleFile)) {
      console.error('Sample data file not found. Please run the scraper first.');
      return;
    }

    const rawData = fs.readFileSync(sampleFile, 'utf8');
    const data = JSON.parse(rawData);
    
    console.log(`Importing ${data.exercises.length} sample exercises...`);

    for (const exercise of data.exercises) {
      try {
        // Check if exercise already exists
        const existing = await prisma.exercise.findFirst({
          where: { name: exercise.name }
        });

        if (!existing) {
          await prisma.exercise.create({
            data: {
              name: exercise.name,
              description: exercise.description,
              category: exercise.category,
              muscleGroup: exercise.muscleGroup,
              equipment: exercise.equipment,
              instructions: exercise.instructions,
              isPublic: exercise.isPublic,
              isPredefined: exercise.isPredefined,
              userId: null
            }
          });
          console.log(`Imported: ${exercise.name}`);
        } else {
          console.log(`Skipped existing: ${exercise.name}`);
        }
      } catch (error) {
        console.error(`Error importing ${exercise.name}:`, error.message);
      }
    }

    console.log('Sample data import completed!');

  } catch (error) {
    console.error('Sample import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Function to clean up duplicate exercises
async function cleanupDuplicates() {
  console.log('Cleaning up duplicate exercises...');
  
  try {
    // Find exercises with duplicate names
    const duplicates = await prisma.exercise.groupBy({
      by: ['name'],
      having: {
        name: {
          _count: {
            gt: 1
          }
        }
      }
    });

    console.log(`Found ${duplicates.length} duplicate exercise names`);

    for (const duplicate of duplicates) {
      // Get all exercises with this name
      const exercises = await prisma.exercise.findMany({
        where: { name: duplicate.name },
        orderBy: { createdAt: 'asc' }
      });

      // Keep the first one, delete the rest
      for (let i = 1; i < exercises.length; i++) {
        await prisma.exercise.delete({
          where: { id: exercises[i].id }
        });
        console.log(`Deleted duplicate: ${exercises[i].name} (${exercises[i].id})`);
      }
    }

    console.log('Cleanup completed!');

  } catch (error) {
    console.error('Cleanup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Main function to handle command line arguments
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'full':
      await importExercisesToDatabase();
      break;
    case 'sample':
      await importSampleData();
      break;
    case 'cleanup':
      await cleanupDuplicates();
      break;
    default:
      console.log('Usage:');
      console.log('  npm run import:exercises full    - Import all scraped exercises');
      console.log('  npm run import:exercises sample  - Import sample data for testing');
      console.log('  npm run import:exercises cleanup - Remove duplicate exercises');
      break;
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => {
      console.log('✅ Import process completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Import process failed:', error);
      process.exit(1);
    });
}

export {
  importExercisesToDatabase,
  importSampleData,
  cleanupDuplicates
};
