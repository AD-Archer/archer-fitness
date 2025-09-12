/* eslint-disable no-console */
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
    const dataFile = path.join(__dirname, '..', 'data', 'all-exercises.json');
    
    if (!fs.existsSync(dataFile)) {
      console.error('Exercise data file not found. Please run the scraper first.');
      return;
    }

    const rawData = fs.readFileSync(dataFile, 'utf8');
    const data = JSON.parse(rawData);
    
    console.log(`Found ${data.exercises.length} exercises to import...`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    // First, ensure all muscles exist
    const allMuscles = new Set();
    const allEquipments = new Set();

    data.exercises.forEach(exercise => {
      // Collect all target and secondary muscles
      if (exercise.targetMuscles) {
        exercise.targetMuscles.forEach(muscle => allMuscles.add(muscle));
      }
      if (exercise.secondaryMuscles) {
        exercise.secondaryMuscles.forEach(muscle => allMuscles.add(muscle));
      }
      // Collect all equipments
      if (exercise.equipments) {
        exercise.equipments.forEach(equipment => allEquipments.add(equipment));
      }
    });

    console.log(`Found ${allMuscles.size} unique muscles and ${allEquipments.size} unique equipment types`);

    // Create muscles if they don't exist
    for (const muscleName of allMuscles) {
      await prisma.muscle.upsert({
        where: { name: muscleName },
        update: {},
        create: { name: muscleName }
      });
    }

    // Create equipments if they don't exist
    for (const equipmentName of allEquipments) {
      await prisma.equipment.upsert({
        where: { name: equipmentName },
        update: {},
        create: { name: equipmentName }
      });
    }

    console.log('✅ Muscles and equipment tables populated');

    for (const exercise of data.exercises) {
      try {
        // Check if exercise already exists by name
        const existing = await prisma.exercise.findFirst({
          where: { name: exercise.name }
        });

        if (existing) {
          console.log(`Skipping existing exercise: ${exercise.name}`);
          skipped++;
          continue;
        }

        // Create new exercise with GIF URL and proper relationships
        const createdExercise = await prisma.exercise.create({
          data: {
            name: exercise.name,
            description: exercise.description,
            instructions: exercise.instructions?.join('\n'),
            gifUrl: exercise.gifUrl,
            isPublic: true,
            isPredefined: true,
            userId: null
          }
        });

        // Add muscle relationships
        if (exercise.targetMuscles || exercise.secondaryMuscles) {
          const muscleRelations = [];

          // Primary muscles
          if (exercise.targetMuscles) {
            for (const muscleName of exercise.targetMuscles) {
              const muscle = await prisma.muscle.findUnique({
                where: { name: muscleName }
              });
              if (muscle) {
                muscleRelations.push({
                  muscleId: muscle.id,
                  isPrimary: true
                });
              }
            }
          }

          // Secondary muscles
          if (exercise.secondaryMuscles) {
            for (const muscleName of exercise.secondaryMuscles) {
              const muscle = await prisma.muscle.findUnique({
                where: { name: muscleName }
              });
              if (muscle) {
                muscleRelations.push({
                  muscleId: muscle.id,
                  isPrimary: false
                });
              }
            }
          }

          // Create muscle relationships
          for (const relation of muscleRelations) {
            await prisma.exerciseMuscle.create({
              data: {
                exerciseId: createdExercise.id,
                muscleId: relation.muscleId,
                isPrimary: relation.isPrimary
              }
            });
          }
        }

        // Add equipment relationships
        if (exercise.equipments) {
          for (const equipmentName of exercise.equipments) {
            const equipment = await prisma.equipment.findUnique({
              where: { name: equipmentName }
            });
            if (equipment) {
              await prisma.exerciseEquipment.create({
                data: {
                  exerciseId: createdExercise.id,
                  equipmentId: equipment.id
                }
              });
            }
          }
        }

        imported++;
        
        if (imported % 50 === 0) {
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
    const sampleFile = path.join(__dirname, '..', 'data', 'all-exercises.json');
    
    if (!fs.existsSync(sampleFile)) {
      console.error('Sample data file not found.');
      return;
    }

    const rawData = fs.readFileSync(sampleFile, 'utf8');
    const data = JSON.parse(rawData);
    
    console.log(`Importing first 10 exercises as sample...`);

    const sampleExercises = data.exercises.slice(0, 10);

    for (const exercise of sampleExercises) {
      try {
        // Check if exercise already exists
        const existing = await prisma.exercise.findFirst({
          where: { name: exercise.name }
        });

        if (!existing) {
          // Create exercise with GIF URL and relationships
          const createdExercise = await prisma.exercise.create({
            data: {
              name: exercise.name,
              description: exercise.description,
              instructions: exercise.instructions?.join('\n'),
              gifUrl: exercise.gifUrl,
              isPublic: true,
              isPredefined: true,
              userId: null
            }
          });

          // Add muscle relationships
          if (exercise.targetMuscles || exercise.secondaryMuscles) {
            // Primary muscles
            if (exercise.targetMuscles) {
              for (const muscleName of exercise.targetMuscles) {
                const muscle = await prisma.muscle.upsert({
                  where: { name: muscleName },
                  update: {},
                  create: { name: muscleName }
                });
                await prisma.exerciseMuscle.create({
                  data: {
                    exerciseId: createdExercise.id,
                    muscleId: muscle.id,
                    isPrimary: true
                  }
                });
              }
            }

            // Secondary muscles
            if (exercise.secondaryMuscles) {
              for (const muscleName of exercise.secondaryMuscles) {
                const muscle = await prisma.muscle.upsert({
                  where: { name: muscleName },
                  update: {},
                  create: { name: muscleName }
                });
                await prisma.exerciseMuscle.create({
                  data: {
                    exerciseId: createdExercise.id,
                    muscleId: muscle.id,
                    isPrimary: false
                  }
                });
              }
            }
          }

          // Add equipment relationships
          if (exercise.equipments) {
            for (const equipmentName of exercise.equipments) {
              const equipment = await prisma.equipment.upsert({
                where: { name: equipmentName },
                update: {},
                create: { name: equipmentName }
              });
              await prisma.exerciseEquipment.create({
                data: {
                  exerciseId: createdExercise.id,
                  equipmentId: equipment.id
                }
              });
            }
          }

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
