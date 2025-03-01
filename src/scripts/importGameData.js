const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Path to data files
const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const ITEMS_FILE = path.join(DATA_DIR, 'items.json');
const RECIPES_FILE = path.join(DATA_DIR, 'recipes.json');
const BUILDINGS_FILE = path.join(DATA_DIR, 'buildings.json');

// Load JSON data
const loadJsonFile = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading file ${filePath}:`, error);
    return {};
  }
};

// Import game items
async function importGameItems() {
  console.log('Importing game items...');
  const itemsData = loadJsonFile(ITEMS_FILE);
  
  let count = 0;
  for (const [className, itemArray] of Object.entries(itemsData)) {
    const item = itemArray[0]; // Each item is in an array with one element
    
    try {
      await prisma.gameItem.upsert({
        where: { className },
        update: {
          name: item.name || 'Unknown Item',
          description: item.description || '',
          stackSize: item.stackSize ? parseInt(item.stackSize) : null,
          energy: item.energy || 0,
          radioactive: item.radioactive ? 1 : 0,
          canBeDiscarded: item.canBeDiscarded !== false,
          sinkPoints: item.sinkPoints ? parseInt(item.sinkPoints) : null,
          abbreviation: item.abbreviation || '',
          form: item.form || null,
          fluidColor: item.fluidColor || null,
          alienItem: item.alienItem || false,
          stable: item.stable !== false,
          experimental: item.experimental || false
        },
        create: {
          className,
          name: item.name || 'Unknown Item',
          description: item.description || '',
          stackSize: item.stackSize ? parseInt(item.stackSize) : null,
          energy: item.energy || 0,
          radioactive: item.radioactive ? 1 : 0,
          canBeDiscarded: item.canBeDiscarded !== false,
          sinkPoints: item.sinkPoints ? parseInt(item.sinkPoints) : null,
          abbreviation: item.abbreviation || '',
          form: item.form || null,
          fluidColor: item.fluidColor || null,
          alienItem: item.alienItem || false,
          stable: item.stable !== false,
          experimental: item.experimental || false
        }
      });
      count++;
      if (count % 50 === 0) {
        console.log(`Imported ${count} items...`);
      }
    } catch (error) {
      console.error(`Error importing item ${className}:`, error);
    }
  }
  
  console.log(`Imported ${count} game items.`);
}

// Import game buildings
async function importGameBuildings() {
  console.log('Importing game buildings...');
  const buildingsData = loadJsonFile(BUILDINGS_FILE);
  
  let count = 0;
  for (const [className, buildingArray] of Object.entries(buildingsData)) {
    const building = buildingArray[0]; // Each building is in an array with one element
    
    try {
      await prisma.gameBuilding.upsert({
        where: { className },
        update: {
          name: building.name || 'Unknown Building',
          description: building.description || '',
          unlockedBy: building.unlockedBy || null,
          powerUsage: building.powerUsage || 0,
          powerGenerated: building.powerGenerated || 0,
          supplementPerMinute: building.supplementPerMinute || null,
          overclockable: building.overclockable !== false,
          somersloopSlots: building.somersloopSlots || 0,
          isVehicle: building.isVehicle || false,
          stable: building.stable !== false,
          experimental: building.experimental || false
        },
        create: {
          className,
          name: building.name || 'Unknown Building',
          description: building.description || '',
          unlockedBy: building.unlockedBy || null,
          powerUsage: building.powerUsage || 0,
          powerGenerated: building.powerGenerated || 0,
          supplementPerMinute: building.supplementPerMinute || null,
          overclockable: building.overclockable !== false,
          somersloopSlots: building.somersloopSlots || 0,
          isVehicle: building.isVehicle || false,
          stable: building.stable !== false,
          experimental: building.experimental || false
        }
      });
      count++;
      if (count % 50 === 0) {
        console.log(`Imported ${count} buildings...`);
      }
    } catch (error) {
      console.error(`Error importing building ${className}:`, error);
    }
  }
  
  console.log(`Imported ${count} game buildings.`);
}

// Import game recipes
async function importGameRecipes() {
  console.log('Importing game recipes...');
  const recipesData = loadJsonFile(RECIPES_FILE);
  
  let count = 0;
  for (const [className, recipeArray] of Object.entries(recipesData)) {
    const recipe = recipeArray[0]; // Each recipe is in an array with one element
    
    try {
      // Create the recipe
      await prisma.gameRecipe.upsert({
        where: { className },
        update: {
          name: recipe.name || 'Unknown Recipe',
          unlockedBy: recipe.unlockedBy || null,
          duration: recipe.duration || 0,
          alternate: recipe.alternate || false,
          inCraftBench: recipe.inCraftBench || false,
          inWorkshop: recipe.inWorkshop || false,
          inBuildGun: recipe.inBuildGun || false,
          inCustomizer: recipe.inCustomizer || false,
          manualCraftingMultiplier: recipe.manualCraftingMultiplier || 1,
          minPower: recipe.minPower || 0,
          maxPower: recipe.maxPower || 0,
          stable: recipe.stable !== false,
          experimental: recipe.experimental || false
        },
        create: {
          className,
          name: recipe.name || 'Unknown Recipe',
          unlockedBy: recipe.unlockedBy || null,
          duration: recipe.duration || 0,
          alternate: recipe.alternate || false,
          inCraftBench: recipe.inCraftBench || false,
          inWorkshop: recipe.inWorkshop || false,
          inBuildGun: recipe.inBuildGun || false,
          inCustomizer: recipe.inCustomizer || false,
          manualCraftingMultiplier: recipe.manualCraftingMultiplier || 1,
          minPower: recipe.minPower || 0,
          maxPower: recipe.maxPower || 0,
          stable: recipe.stable !== false,
          experimental: recipe.experimental || false
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
      if (recipe.ingredients && recipe.ingredients.length > 0) {
        for (const ingredient of recipe.ingredients) {
          try {
            await prisma.gameRecipeItem.create({
              data: {
                amount: ingredient.amount,
                isInput: true,
                recipe: { connect: { className } },
                item: { connect: { className: ingredient.item } }
              }
            });
          } catch (error) {
            console.error(`Error adding ingredient ${ingredient.item} to recipe ${className}:`, error);
          }
        }
      }
      
      // Add recipe products (outputs)
      if (recipe.products && recipe.products.length > 0) {
        for (const product of recipe.products) {
          try {
            await prisma.gameRecipeItem.create({
              data: {
                amount: product.amount,
                isInput: false,
                recipe: { connect: { className } },
                item: { connect: { className: product.item } }
              }
            });
          } catch (error) {
            console.error(`Error adding product ${product.item} to recipe ${className}:`, error);
          }
        }
      }
      
      // Add buildings where this recipe can be produced
      if (recipe.producedIn && recipe.producedIn.length > 0) {
        for (const buildingClassName of recipe.producedIn) {
          try {
            await prisma.gameRecipeBuilding.create({
              data: {
                recipe: { connect: { className } },
                building: { connect: { className: buildingClassName } }
              }
            });
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
    }
  }
  
  console.log(`Imported ${count} game recipes.`);
}

// Main import function
async function importAllGameData() {
  try {
    console.log('Starting game data import...');
    
    // Import in order: items first, then buildings, then recipes
    await importGameItems();
    await importGameBuildings();
    await importGameRecipes();
    
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

module.exports = { importAllGameData }; 