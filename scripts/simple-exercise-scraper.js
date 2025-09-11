import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration for exercisedb.dev API
const API_CONFIG = {
  baseUrl: 'https://www.exercisedb.dev/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
};

// Sleep function for rate limiting
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to make API request with error handling
async function makeApiRequest(url) {
  try {
    console.log(`Making request to: ${url}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: API_CONFIG.headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error making request to ${url}:`, error.message);
    throw error;
  }
}

// Function to get all exercises with aggressive pagination
async function getAllExercises() {
  console.log('Fetching ALL exercises from ExerciseDB...');
  
  const allExercises = new Map(); // Use Map to avoid duplicates
  let offset = 0;
  const limit = 100;
  let page = 0;
  let totalRequests = 0;
  
  try {
    while (true) {
      const url = `${API_CONFIG.baseUrl}/exercises?offset=${offset}&limit=${limit}`;
      const response = await makeApiRequest(url);
      totalRequests++;
      
      // Handle the API response structure
      if (!response.success || !response.data) {
        console.log('Invalid response structure, stopping');
        break;
      }
      
      const exercises = response.data;
      
      if (exercises.length === 0) {
        console.log('No more exercises found, stopping pagination');
        break;
      }
      
      // Add exercises to our map (avoid duplicates)
      exercises.forEach(exercise => {
        const id = exercise.exerciseId || exercise.name;
        if (id && !allExercises.has(id)) {
          allExercises.set(id, {
            exerciseId: exercise.exerciseId,
            name: exercise.name,
            bodyParts: exercise.bodyParts || [],
            targetMuscles: exercise.targetMuscles || [],
            equipments: exercise.equipments || [],
            gifUrl: exercise.gifUrl,
            instructions: exercise.instructions || [],
            secondaryMuscles: exercise.secondaryMuscles || [],
            // Simplified fields for easier mapping
            bodyPart: exercise.bodyParts?.[0] || 'unknown',
            target: exercise.targetMuscles?.[0] || 'unknown',
            equipment: exercise.equipments?.[0] || 'bodyweight',
            source: 'exercisedb.dev',
            scrapedAt: new Date().toISOString()
          });
        }
      });
      
      console.log(`Page ${page + 1}: Added ${exercises.length} exercises (total unique: ${allExercises.size})`);
      
      offset += limit;
      page++;
      
      // Rate limiting between requests (be nice to the free API)
      await sleep(2000); // 2 second delay between requests
      
      // Use the metadata to check if we've reached the end
      if (response.metadata && response.metadata.totalExercises) {
        if (allExercises.size >= response.metadata.totalExercises) {
          console.log(`Reached total exercises count (${response.metadata.totalExercises}), stopping`);
          break;
        }
      }
      
      // Safety break to avoid infinite loops
      if (page > 50) {
        console.log('Reached maximum page limit (50), stopping');
        break;
      }
    }
    
    console.log(`\n=== Final Results ===`);
    console.log(`Total unique exercises collected: ${allExercises.size}`);
    console.log(`Total API requests made: ${totalRequests}`);
    
    return Array.from(allExercises.values());
  } catch (error) {
    console.error('Failed to fetch exercises:', error.message);
    return Array.from(allExercises.values()); // Return what we got so far
  }
}

// Function to save data to JSON files
async function saveExerciseData(exercises) {
  const outputDir = path.join(__dirname, '..', 'data');
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Load existing metadata if it exists
  const metadataFile = path.join(outputDir, 'exercisedb-metadata.json');
  let metadata = {};
  if (fs.existsSync(metadataFile)) {
    metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
  }

  // Save complete exercise data
  const exerciseFile = path.join(outputDir, 'all-exercises.json');
  const exerciseData = {
    metadata: {
      scrapedAt: new Date().toISOString(),
      totalExercises: exercises.length,
      source: 'ExerciseDB.dev',
      description: 'Complete exercise database scraped from exercisedb.dev'
    },
    exercises: exercises,
    muscleGroups: metadata.muscles || [],
    equipment: metadata.equipment || [],
    bodyParts: metadata.bodyParts || []
  };

  fs.writeFileSync(exerciseFile, JSON.stringify(exerciseData, null, 2));
  console.log(`\n✅ Complete exercise data saved to: ${exerciseFile}`);

  // Create a summary
  const summary = {
    total: exercises.length,
    byBodyPart: {},
    byEquipment: {},
    byTarget: {},
    scrapedAt: new Date().toISOString()
  };

  exercises.forEach(exercise => {
    // Count by body part
    const bodyPart = exercise.bodyPart || 'unknown';
    summary.byBodyPart[bodyPart] = (summary.byBodyPart[bodyPart] || 0) + 1;

    // Count by equipment
    const equipment = exercise.equipment || 'unknown';
    summary.byEquipment[equipment] = (summary.byEquipment[equipment] || 0) + 1;

    // Count by target muscle
    const target = exercise.target || 'unknown';
    summary.byTarget[target] = (summary.byTarget[target] || 0) + 1;
  });

  const summaryFile = path.join(outputDir, 'exercise-summary.json');
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  console.log(`📊 Exercise summary saved to: ${summaryFile}`);

  return exerciseFile;
}

// Main function
async function main() {
  console.log('🚀 Starting complete exercise database scraper...\n');
  
  try {
    const exercises = await getAllExercises();
    
    if (exercises.length === 0) {
      console.error('❌ No exercises were collected!');
      return;
    }

    const savedFile = await saveExerciseData(exercises);
    
    console.log('\n🎉 Scraping completed successfully!');
    console.log('\nFiles created:');
    console.log(`- ${savedFile} (complete exercise database)`);
    console.log(`- ${path.join(path.dirname(savedFile), 'exercise-summary.json')} (summary statistics)`);
    
    console.log('\n📋 Next steps:');
    console.log('1. Review the complete exercise data');
    console.log('2. Create a database import script');
    console.log('3. Import the exercises into your Prisma database');
    
  } catch (error) {
    console.error('❌ Scraper failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { getAllExercises, saveExerciseData };
