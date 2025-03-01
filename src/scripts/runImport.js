const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;
const https = require('https');

const execAsync = promisify(exec);

// Original URLs for the Satisfactory wiki data
const WIKI_URLS = {
  recipes: 'https://satisfactory.wiki.gg/wiki/Template:DocsRecipes.json?action=raw',
  items: 'https://satisfactory.wiki.gg/wiki/Template:DocsItems.json?action=raw',
  buildings: 'https://satisfactory.wiki.gg/wiki/Template:DocsBuildings.json?action=raw'
};

// Function to fetch data from a URL with proper headers
function fetchData(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      }
    };

    https.get(url, options, (res) => {
      // Check if we got a redirect
      if (res.statusCode === 301 || res.statusCode === 302) {
        if (res.headers.location) {
          console.log(`Following redirect to: ${res.headers.location}`);
          return fetchData(res.headers.location).then(resolve).catch(reject);
        }
      }

      // Check for successful response
      if (res.statusCode !== 200) {
        return reject(new Error(`Request failed with status code ${res.statusCode}`));
      }

      let data = '';
      
      // A chunk of data has been received
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      // The whole response has been received
      res.on('end', () => {
        resolve(data);
      });
      
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Function to create empty JSON files with minimal structure if fetching fails
async function createEmptyDataFile(type, filePath) {
  console.log(`Creating empty ${type} data file as fallback...`);
  let emptyData = {};
  
  // Create appropriate empty structure based on type
  if (type === 'items') {
    emptyData = { "Desc_Stone_C": [{ "name": "Stone", "className": "Desc_Stone_C", "description": "Basic resource" }] };
  } else if (type === 'recipes') {
    emptyData = { "Recipe_Stone_C": [{ "name": "Stone Recipe", "className": "Recipe_Stone_C" }] };
  } else if (type === 'buildings') {
    emptyData = { "Build_ConstructorMk1_C": [{ "name": "Constructor", "className": "Build_ConstructorMk1_C" }] };
  }
  
  await fs.writeFile(filePath, JSON.stringify(emptyData, null, 2));
  console.log(`Created empty ${type} data file at ${filePath}`);
  return JSON.stringify(emptyData);
}

// Function to fetch and save the latest data from the wiki
async function fetchLatestData() {
  console.log('Fetching latest data from Satisfactory wiki...');
  
  const dataDir = path.join(process.cwd(), 'src', 'data');
  
  // Ensure the data directory exists
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
  
  // Fetch and save each data file
  for (const [type, url] of Object.entries(WIKI_URLS)) {
    try {
      console.log(`Fetching ${type} data from ${url}...`);
      let data;
      
      try {
        data = await fetchData(url);
        console.log(`Successfully fetched ${type} data`);
      } catch (fetchError) {
        console.error(`Error fetching ${type} data:`, fetchError.message);
        
        // Check if we already have a file we can use
        const filePath = path.join(dataDir, `${type}.json`);
        try {
          const existingData = await fs.readFile(filePath, 'utf8');
          console.log(`Using existing ${type} data file`);
          data = existingData;
        } catch (readError) {
          // If no existing file, create an empty one
          data = await createEmptyDataFile(type, filePath);
        }
      }
      
      // Validate that the data is valid JSON
      try {
        JSON.parse(data);
        console.log(`Successfully parsed ${type} data as JSON`);
      } catch (error) {
        console.error(`Error parsing ${type} data as JSON:`, error);
        console.error('Response data preview:', data.substring(0, 200));
        
        // Create empty data file if parsing fails
        const filePath = path.join(dataDir, `${type}.json`);
        data = await createEmptyDataFile(type, filePath);
      }
      
      // Save to data directory if we haven't already
      const filePath = path.join(dataDir, `${type}.json`);
      await fs.writeFile(filePath, data);
      console.log(`Saved ${type} data to ${filePath}`);
      
    } catch (error) {
      console.error(`Error processing ${type} data:`, error);
    }
  }
  
  console.log('Data fetch completed.');
}

async function runImport() {
  try {
    console.log('Starting the game data import process...');
    
    // Step 1: Fetch the latest data from the wiki
    console.log('Step 1: Fetching latest data from the wiki...');
    await fetchLatestData();
    
    // Step 2: Run Prisma migration
    console.log('Step 2: Running Prisma migration...');
    try {
      const { stdout, stderr } = await execAsync('npx prisma migrate dev --name add_game_data_models');
      console.log('Migration stdout:', stdout);
      if (stderr) console.error('Migration stderr:', stderr);
    } catch (error) {
      console.error('Error running migration:', error);
      console.log('Continuing with import process...');
    }
    
    // Step 3: Generate Prisma client
    console.log('Step 3: Generating Prisma client...');
    try {
      const { stdout, stderr } = await execAsync('npx prisma generate');
      console.log('Generate stdout:', stdout);
      if (stderr) console.error('Generate stderr:', stderr);
    } catch (error) {
      console.error('Error generating Prisma client:', error);
      return;
    }
    
    // Step 4: Run the import script
    console.log('Step 4: Running the import script...');
    const importScriptPath = path.join(__dirname, 'importGameData.js');
    try {
      // Use require instead of ts-node
      const { importAllGameData } = require('./importGameData.js');
      await importAllGameData();
      console.log('Import completed successfully');
    } catch (error) {
      console.error('Error running import script:', error);
      return;
    }
    
    console.log('Game data import process completed successfully!');
  } catch (error) {
    console.error('Error in runImport:', error);
  }
}

// If this script is run directly (not imported)
if (require.main === module) {
  // Check if we should only fetch data
  const fetchOnly = process.argv.includes('--fetch-only');
  
  if (fetchOnly) {
    console.log('Running in fetch-only mode');
    fetchLatestData();
  } else {
    runImport();
  }
}

// Export the functions for use in other scripts
module.exports = { fetchLatestData, runImport }; 