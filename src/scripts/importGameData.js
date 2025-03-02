const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Path to data files
const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const ITEMS_FILE = path.join(DATA_DIR, 'items.json');
const RECIPES_FILE = path.join(DATA_DIR, 'recipes.json');
const BUILDINGS_FILE = path.join(DATA_DIR, 'buildings.json');

// Load JSON data with better error handling
const loadJsonFile = (filePath) => {
  try {
    console.log(`Loading data from ${filePath}...`);
    const data = fs.readFileSync(filePath, 'utf8');
    const parsedData = JSON.parse(data);
    console.log(`Successfully loaded data from ${filePath} (${Object.keys(parsedData).length} entries)`);
    return parsedData;
  } catch (error) {
    console.error(`Error loading file ${filePath}:`, error);
    return {};
  }
};

// Validate data before importing
const validateData = (data, type) => {
  if (!data || Object.keys(data).length === 0) {
    console.error(`No ${type} data found or data is empty.`);
    return false;
  }
  
  console.log(`Validating ${Object.keys(data).length} ${type} entries...`);
  
  // Basic validation based on type
  let valid = true;
  let validCount = 0;
  let invalidCount = 0;
  
  for (const [className, itemArray] of Object.entries(data)) {
    if (!Array.isArray(itemArray) || itemArray.length === 0) {
      console.error(`Invalid ${type} data for ${className}: Not an array or empty array`);
      valid = false;
      invalidCount++;
      continue;
    }
    
    const item = itemArray[0];
    
    // Check for required fields based on type
    if (type === 'items' && (!item.name)) {
      console.error(`Invalid item data for ${className}: Missing required fields`);
      valid = false;
      invalidCount++;
    } else if (type === 'buildings' && (!item.name)) {
      console.error(`Invalid building data for ${className}: Missing required fields`);
      valid = false;
      invalidCount++;
    } else if (type === 'recipes' && (!item.name)) {
      console.error(`Invalid recipe data for ${className}: Missing required fields`);
      valid = false;
      invalidCount++;
    } else {
      validCount++;
    }
  }
  
  console.log(`Validation complete: ${validCount} valid entries, ${invalidCount} invalid entries`);
  return valid;
};

// Parse numeric values safely
const parseNumeric = (value, defaultValue = null) => {
  if (value === undefined || value === null) return defaultValue;
  
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Parse boolean values safely
const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase();
    if (lowerValue === 'true' || lowerValue === 'yes' || lowerValue === '1') return true;
    if (lowerValue === 'false' || lowerValue === 'no' || lowerValue === '0') return false;
  }
  return defaultValue;
};

// Import game items with improved parsing
async function importGameItems() {
  console.log('Importing game items...');
  const itemsData = loadJsonFile(ITEMS_FILE);
  
  if (!validateData(itemsData, 'items')) {
    console.error('Item data validation failed. Skipping import.');
    return;
  }
  
  let count = 0;
  let errorCount = 0;
  
  for (const [className, itemArray] of Object.entries(itemsData)) {
    const item = itemArray[0]; // Each item is in an array with one element
    
    try {
      await prisma.gameItem.upsert({
        where: { className },
        update: {
          name: item.name || 'Unknown Item',
          description: item.description || '',
          stackSize: item.stackSize ? parseInt(item.stackSize) : null,
          energy: parseNumeric(item.energy, 0),
          radioactive: parseNumeric(item.radioactive, 0),
          canBeDiscarded: parseBoolean(item.canBeDiscarded, true),
          sinkPoints: item.sinkPoints ? parseInt(item.sinkPoints) : null,
          abbreviation: item.abbreviation || '',
          form: item.form || null,
          fluidColor: item.fluidColor || null,
          alienItem: parseBoolean(item.alienItem, false),
          stable: parseBoolean(item.stable, true),
          experimental: parseBoolean(item.experimental, false)
        },
        create: {
          className,
          name: item.name || 'Unknown Item',
          description: item.description || '',
          stackSize: item.stackSize ? parseInt(item.stackSize) : null,
          energy: parseNumeric(item.energy, 0),
          radioactive: parseNumeric(item.radioactive, 0),
          canBeDiscarded: parseBoolean(item.canBeDiscarded, true),
          sinkPoints: item.sinkPoints ? parseInt(item.sinkPoints) : null,
          abbreviation: item.abbreviation || '',
          form: item.form || null,
          fluidColor: item.fluidColor || null,
          alienItem: parseBoolean(item.alienItem, false),
          stable: parseBoolean(item.stable, true),
          experimental: parseBoolean(item.experimental, false)
        }
      });
      count++;
      if (count % 50 === 0) {
        console.log(`Imported ${count} items...`);
      }
    } catch (error) {
      console.error(`Error importing item ${className}:`, error);
      errorCount++;
    }
  }
  
  console.log(`Imported ${count} game items with ${errorCount} errors.`);
  return count;
}

// Import game buildings with improved parsing
async function importGameBuildings() {
  console.log('Importing game buildings...');
  const buildingsData = loadJsonFile(BUILDINGS_FILE);
  
  if (!validateData(buildingsData, 'buildings')) {
    console.error('Building data validation failed. Skipping import.');
    return;
  }
  
  let count = 0;
  let errorCount = 0;
  
  for (const [className, buildingArray] of Object.entries(buildingsData)) {
    const building = buildingArray[0]; // Each building is in an array with one element
    
    try {
      await prisma.gameBuilding.upsert({
        where: { className },
        update: {
          name: building.name || 'Unknown Building',
          description: building.description || '',
          unlockedBy: building.unlockedBy || null,
          powerUsage: parseNumeric(building.powerUsage, 0),
          powerGenerated: parseNumeric(building.powerGenerated, 0),
          supplementPerMinute: parseNumeric(building.supplementPerMinute, null),
          overclockable: parseBoolean(building.overclockable, true),
          somersloopSlots: parseInt(building.somersloopSlots || 0),
          isVehicle: parseBoolean(building.isVehicle, false),
          stable: parseBoolean(building.stable, true),
          experimental: parseBoolean(building.experimental, false)
        },
        create: {
          className,
          name: building.name || 'Unknown Building',
          description: building.description || '',
          unlockedBy: building.unlockedBy || null,
          powerUsage: parseNumeric(building.powerUsage, 0),
          powerGenerated: parseNumeric(building.powerGenerated, 0),
          supplementPerMinute: parseNumeric(building.supplementPerMinute, null),
          overclockable: parseBoolean(building.overclockable, true),
          somersloopSlots: parseInt(building.somersloopSlots || 0),
          isVehicle: parseBoolean(building.isVehicle, false),
          stable: parseBoolean(building.stable, true),
          experimental: parseBoolean(building.experimental, false)
        }
      });
      count++;
      if (count % 50 === 0) {
        console.log(`Imported ${count} buildings...`);
      }
    } catch (error) {
      console.error(`Error importing building ${className}:`, error);
      errorCount++;
    }
  }
  
  console.log(`Imported ${count} game buildings with ${errorCount} errors.`);
  return count;
}

// Import game recipes with improved parsing and error handling
async function importGameRecipes() {
  console.log('Importing game recipes...');
  const recipesData = loadJsonFile(RECIPES_FILE);
  
  if (!validateData(recipesData, 'recipes')) {
    console.error('Recipe data validation failed. Skipping import.');
    return;
  }
  
  let count = 0;
  let errorCount = 0;
  let ingredientCount = 0;
  let productCount = 0;
  let buildingCount = 0;
  let missingItemsCount = 0;
  const missingItems = new Set(); // Track unique missing items
  
  for (const [className, recipeArray] of Object.entries(recipesData)) {
    const recipe = recipeArray[0]; // Each recipe is in an array with one element
    
    try {
      // Create the recipe
      await prisma.gameRecipe.upsert({
        where: { className },
        update: {
          name: recipe.name || 'Unknown Recipe',
          unlockedBy: recipe.unlockedBy || null,
          duration: parseNumeric(recipe.duration, 0),
          alternate: parseBoolean(recipe.alternate, false),
          inCraftBench: parseBoolean(recipe.inCraftBench, false),
          inWorkshop: parseBoolean(recipe.inWorkshop, false),
          inBuildGun: parseBoolean(recipe.inBuildGun, false),
          inCustomizer: parseBoolean(recipe.inCustomizer, false),
          manualCraftingMultiplier: parseNumeric(recipe.manualCraftingMultiplier, 1),
          minPower: parseNumeric(recipe.minPower, 0),
          maxPower: parseNumeric(recipe.maxPower, 0),
          stable: parseBoolean(recipe.stable, true),
          experimental: parseBoolean(recipe.experimental, false)
        },
        create: {
          className,
          name: recipe.name || 'Unknown Recipe',
          unlockedBy: recipe.unlockedBy || null,
          duration: parseNumeric(recipe.duration, 0),
          alternate: parseBoolean(recipe.alternate, false),
          inCraftBench: parseBoolean(recipe.inCraftBench, false),
          inWorkshop: parseBoolean(recipe.inWorkshop, false),
          inBuildGun: parseBoolean(recipe.inBuildGun, false),
          inCustomizer: parseBoolean(recipe.inCustomizer, false),
          manualCraftingMultiplier: parseNumeric(recipe.manualCraftingMultiplier, 1),
          minPower: parseNumeric(recipe.minPower, 0),
          maxPower: parseNumeric(recipe.maxPower, 0),
          stable: parseBoolean(recipe.stable, true),
          experimental: parseBoolean(recipe.experimental, false)
        }
      });
      
      // Delete existing recipe items and buildings to avoid duplicates
      await prisma.gameRecipeItem.deleteMany({
        where: { recipeId: className }
      });
      
      await prisma.gameRecipeBuilding.deleteMany({
        where: { recipeId: className }
      });
      
      // Add recipe ingredients (inputs)
      if (recipe.ingredients && Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
        for (const ingredient of recipe.ingredients) {
          if (!ingredient.item) {
            console.warn(`Missing item reference in ingredient for recipe ${className}`);
            continue;
          }
          
          try {
            // Check if the item exists before trying to connect to it
            const itemExists = await prisma.gameItem.findUnique({
              where: { className: ingredient.item }
            });
            
            if (!itemExists) {
              missingItems.add(ingredient.item);
              missingItemsCount++;
              console.warn(`Skipping ingredient ${ingredient.item} for recipe ${className} - item does not exist in database`);
              continue;
            }
            
            await prisma.gameRecipeItem.create({
              data: {
                amount: parseNumeric(ingredient.amount, 0),
                isInput: true,
                recipe: { connect: { className } },
                inputItem: { connect: { className: ingredient.item } }
              }
            });
            ingredientCount++;
          } catch (error) {
            console.error(`Error adding ingredient ${ingredient.item} to recipe ${className}:`, error);
          }
        }
      }
      
      // Add recipe products (outputs)
      if (recipe.products && Array.isArray(recipe.products) && recipe.products.length > 0) {
        for (const product of recipe.products) {
          if (!product.item) {
            console.warn(`Missing item reference in product for recipe ${className}`);
            continue;
          }
          
          try {
            // Check if the item exists before trying to connect to it
            const itemExists = await prisma.gameItem.findUnique({
              where: { className: product.item }
            });
            
            if (!itemExists) {
              missingItems.add(product.item);
              missingItemsCount++;
              console.warn(`Skipping product ${product.item} for recipe ${className} - item does not exist in database`);
              continue;
            }
            
            await prisma.gameRecipeItem.create({
              data: {
                amount: parseNumeric(product.amount, 0),
                isInput: false,
                recipe: { connect: { className } },
                inputItem: { connect: { className: product.item } }
              }
            });
            productCount++;
          } catch (error) {
            console.error(`Error adding product ${product.item} to recipe ${className}:`, error);
          }
        }
      }
      
      // Add buildings where this recipe can be produced
      if (recipe.producedIn && Array.isArray(recipe.producedIn) && recipe.producedIn.length > 0) {
        for (const buildingClassName of recipe.producedIn) {
          if (!buildingClassName) {
            console.warn(`Empty building reference for recipe ${className}`);
            continue;
          }
          
          try {
            // Check if the building exists before trying to connect to it
            const buildingExists = await prisma.gameBuilding.findUnique({
              where: { className: buildingClassName }
            });
            
            if (!buildingExists) {
              console.warn(`Skipping building ${buildingClassName} for recipe ${className} - building does not exist in database`);
              continue;
            }
            
            await prisma.gameRecipeBuilding.create({
              data: {
                recipe: { connect: { className } },
                building: { connect: { className: buildingClassName } }
              }
            });
            buildingCount++;
          } catch (error) {
            console.error(`Error connecting recipe ${className} to building ${buildingClassName}:`, error);
          }
        }
      }
      
      count++;
      if (count % 50 === 0) {
        console.log(`Imported ${count} recipes...`);
      }
    } catch (error) {
      console.error(`Error importing recipe ${className}:`, error);
      errorCount++;
    }
  }
  
  console.log(`Imported ${count} game recipes with ${errorCount} errors.`);
  console.log(`Added ${ingredientCount} ingredients and ${productCount} products.`);
  console.log(`Connected recipes to ${buildingCount} buildings.`);
  
  if (missingItems.size > 0) {
    console.log(`Found ${missingItems.size} unique missing items (${missingItemsCount} total references):`);
    console.log(Array.from(missingItems).join(', '));
  }
  
  return count;
}

// Create user items and recipes from game data
async function createUserItemsAndRecipes() {
  console.log('Creating user items and recipes from game data...');
  
  // Get all game items
  const gameItems = await prisma.gameItem.findMany({
    where: {
      stable: true
    }
  });
  
  console.log(`Found ${gameItems.length} stable game items to create user items for`);
  
  // Create user items for each game item
  let itemCount = 0;
  for (const gameItem of gameItems) {
    try {
      // Check if a user item with this name already exists
      const existingItem = await prisma.item.findUnique({
        where: { name: gameItem.name }
      });
      
      if (!existingItem) {
        await prisma.item.create({
          data: {
            name: gameItem.name,
            description: gameItem.description,
            category: gameItem.form,
            gameClassName: gameItem.className
          }
        });
        itemCount++;
      }
    } catch (error) {
      console.error(`Error creating user item for ${gameItem.name}:`, error);
    }
  }
  
  console.log(`Created ${itemCount} user items`);
  
  // Get all game recipes
  const gameRecipes = await prisma.gameRecipe.findMany({
    where: {
      stable: true
    },
    include: {
      recipeItems: {
        include: {
          inputItem: true
        }
      },
      producedIn: {
        include: {
          building: true
        }
      }
    }
  });
  
  console.log(`Found ${gameRecipes.length} stable game recipes to create user recipes for`);
  
  // Create user recipes for each game recipe
  let recipeCount = 0;
  for (const gameRecipe of gameRecipes) {
    try {
      // Check if a user recipe with this name already exists
      const existingRecipe = await prisma.recipe.findUnique({
        where: { name: gameRecipe.name }
      });
      
      if (!existingRecipe) {
        // Create the recipe
        const recipe = await prisma.recipe.create({
          data: {
            name: gameRecipe.name,
            description: `Recipe for ${gameRecipe.name}`,
            craftTime: gameRecipe.duration,
            gameClassName: gameRecipe.className
          }
        });
        
        // Add recipe items
        for (const recipeItem of gameRecipe.recipeItems) {
          // Find the corresponding user item
          const item = await prisma.item.findFirst({
            where: { name: recipeItem.inputItem.name }
          });
          
          if (item) {
            await prisma.recipeItem.create({
              data: {
                quantity: recipeItem.amount,
                isInput: recipeItem.isInput,
                recipe: { connect: { id: recipe.id } },
                item: { connect: { id: item.id } }
              }
            });
          }
        }
        
        recipeCount++;
      }
    } catch (error) {
      console.error(`Error creating user recipe for ${gameRecipe.name}:`, error);
    }
  }
  
  console.log(`Created ${recipeCount} user recipes`);
  return { itemCount, recipeCount };
}

// Main import function
async function importAllGameData() {
  try {
    console.log('Starting game data import...');
    
    // Import in order: items first, then buildings, then recipes
    const itemCount = await importGameItems();
    const buildingCount = await importGameBuildings();
    const recipeCount = await importGameRecipes();
    
    // Create user items and recipes from game data
    const { itemCount: userItemCount, recipeCount: userRecipeCount } = await createUserItemsAndRecipes();
    
    console.log('Game data import summary:');
    console.log(`- Imported ${itemCount} game items`);
    console.log(`- Imported ${buildingCount} game buildings`);
    console.log(`- Imported ${recipeCount} game recipes`);
    console.log(`- Created ${userItemCount} user items`);
    console.log(`- Created ${userRecipeCount} user recipes`);
    
    console.log('Game data import completed successfully!');
  } catch (error) {
    console.error('Error during game data import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import if this script is executed directly
if (require.main === module) {
  importAllGameData();
}

module.exports = { importAllGameData, validateData, loadJsonFile }; 