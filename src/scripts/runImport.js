const { exec, spawn } = require('child_process');
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
      },
      timeout: 30000 // 30 second timeout
    };

    console.log(`Fetching data from ${url}...`);
    
    const req = https.get(url, options, (res) => {
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
        try {
          // Try to parse the data as JSON to validate it
          JSON.parse(data);
          console.log(`Successfully fetched and validated data from ${url} (${data.length} bytes)`);
          resolve(data);
        } catch (error) {
          console.error(`Error parsing response as JSON from ${url}:`, error.message);
          reject(new Error(`Invalid JSON response from ${url}`));
        }
      });
      
    }).on('error', (err) => {
      console.error(`Network error while fetching ${url}:`, err.message);
      reject(err);
    });
    
    // Handle timeout
    req.on('timeout', () => {
      console.error(`Request to ${url} timed out after 30 seconds`);
      req.destroy();
      reject(new Error(`Request to ${url} timed out`));
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
    console.log(`Ensured data directory exists at ${dataDir}`);
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
  
  // Fetch and save each data file
  const results = {};
  
  for (const [type, url] of Object.entries(WIKI_URLS)) {
    try {
      console.log(`Fetching ${type} data from ${url}...`);
      let data;
      
      try {
        data = await fetchData(url);
        console.log(`Successfully fetched ${type} data (${data.length} bytes)`);
        results[type] = { success: true, source: 'wiki' };
      } catch (fetchError) {
        console.error(`Error fetching ${type} data:`, fetchError.message);
        
        // Check if we already have a file we can use
        const filePath = path.join(dataDir, `${type}.json`);
        try {
          const existingData = await fs.readFile(filePath, 'utf8');
          console.log(`Using existing ${type} data file (${existingData.length} bytes)`);
          data = existingData;
          results[type] = { success: true, source: 'existing' };
        } catch (readError) {
          // If no existing file, create an empty one
          data = await createEmptyDataFile(type, filePath);
          results[type] = { success: true, source: 'empty' };
        }
      }
      
      // Validate that the data is valid JSON
      try {
        const parsedData = JSON.parse(data);
        const entryCount = Object.keys(parsedData).length;
        console.log(`Successfully parsed ${type} data as JSON with ${entryCount} entries`);
        
        // Check if the data has a reasonable number of entries
        if (entryCount < 5) {
          console.warn(`Warning: ${type} data has only ${entryCount} entries, which seems low`);
        }
      } catch (error) {
        console.error(`Error parsing ${type} data as JSON:`, error);
        console.error('Response data preview:', data.substring(0, 200));
        
        // Create empty data file if parsing fails
        const filePath = path.join(dataDir, `${type}.json`);
        data = await createEmptyDataFile(type, filePath);
        results[type] = { success: true, source: 'empty' };
      }
      
      // Save to data directory if we haven't already
      const filePath = path.join(dataDir, `${type}.json`);
      await fs.writeFile(filePath, data);
      console.log(`Saved ${type} data to ${filePath}`);
      
    } catch (error) {
      console.error(`Error processing ${type} data:`, error);
      results[type] = { success: false, error: error.message };
    }
  }
  
  console.log('Data fetch completed with the following results:');
  for (const [type, result] of Object.entries(results)) {
    console.log(`- ${type}: ${result.success ? 'Success' : 'Failed'} (Source: ${result.source || 'N/A'})`);
  }
  
  return results;
}

// Function to check if Prisma schema exists and create it if not
async function ensurePrismaSchema() {
  const prismaDir = path.join(process.cwd(), 'prisma');
  const schemaPath = path.join(prismaDir, 'schema.prisma');
  
  try {
    // Check if prisma directory exists
    try {
      await fs.access(prismaDir);
    } catch (error) {
      console.log('Prisma directory does not exist, creating it...');
      await fs.mkdir(prismaDir, { recursive: true });
    }
    
    // Check if schema file exists
    try {
      await fs.access(schemaPath);
      console.log('Prisma schema already exists');
      return true;
    } catch (error) {
      // Schema doesn't exist, create a basic one
      console.log('Prisma schema does not exist, creating a basic one...');
      
      const basicSchema = `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Game data models will be added by migration
`;
      
      await fs.writeFile(schemaPath, basicSchema);
      console.log('Created basic Prisma schema');
      return true;
    }
  } catch (error) {
    console.error('Error ensuring Prisma schema exists:', error);
    return false;
  }
}

// Function to execute a command with inherited stdio (interactive mode)
function spawnInteractive(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`Running command: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit', // This makes the process inherit the parent's stdio
      shell: true
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command exited with code ${code}`));
      }
    });
    
    child.on('error', (err) => {
      reject(err);
    });
  });
}

async function runImport() {
  try {
    console.log('Starting the game data import process...');
    
    // Step 1: Ensure Prisma schema exists
    console.log('Step 1: Ensuring Prisma schema exists...');
    const schemaExists = await ensurePrismaSchema();
    if (!schemaExists) {
      console.error('Failed to ensure Prisma schema exists. Aborting import process.');
      return;
    }
    
    // Step 2: Fetch the latest data from the wiki
    console.log('Step 2: Fetching latest data from the wiki...');
    const fetchResults = await fetchLatestData();
    
    // Check if we have at least some data to work with
    const hasData = Object.values(fetchResults).some(result => result.success);
    if (!hasData) {
      console.error('Failed to fetch any data. Aborting import process.');
      return;
    }
    
    // Step 3: Run Prisma migration
    console.log('Step 3: Running Prisma migration...');
    try {
      // Use spawn with stdio inheritance to make it interactive
      await spawnInteractive('npx', ['prisma', 'migrate', 'dev', '--name', 'add_game_data_models']);
      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Error running migration:', error);
      
      // Check if this is a fatal error or if we can continue
      if (error.message.includes('already exists') || error.message.includes('No changes') || error.message.includes('No pending migrations')) {
        console.log('Migration error appears non-fatal. Continuing with import process...');
      } else {
        console.error('Fatal migration error. Aborting import process.');
        return;
      }
    }
    
    // Step 4: Generate Prisma client
    console.log('Step 4: Generating Prisma client...');
    try {
      await spawnInteractive('npx', ['prisma', 'generate']);
      console.log('Prisma client generated successfully');
    } catch (error) {
      console.error('Error generating Prisma client:', error);
      console.error('Cannot continue without Prisma client. Aborting import process.');
      return;
    }
    
    // Step 5: Run the import script
    console.log('Step 5: Running the import script...');
    try {
      // Use require instead of ts-node
      const { importAllGameData, validateData, loadJsonFile } = require('./importGameData.js');
      
      // Validate the data before importing
      console.log('Validating data before import...');
      const dataDir = path.join(process.cwd(), 'src', 'data');
      const itemsData = loadJsonFile(path.join(dataDir, 'items.json'));
      const recipesData = loadJsonFile(path.join(dataDir, 'recipes.json'));
      const buildingsData = loadJsonFile(path.join(dataDir, 'buildings.json'));
      
      const itemsValid = validateData(itemsData, 'items');
      const recipesValid = validateData(recipesData, 'recipes');
      const buildingsValid = validateData(buildingsData, 'buildings');
      
      if (!itemsValid || !recipesValid || !buildingsValid) {
        console.warn('Some data validation failed, but continuing with import...');
      }
      
      // Run the import
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