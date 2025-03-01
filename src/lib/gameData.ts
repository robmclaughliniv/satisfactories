import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Utility functions for working with Satisfactory game data
 */

/**
 * Get all game items
 */
export async function getAllGameItems() {
  return prisma.gameItem.findMany({
    orderBy: { name: 'asc' }
  });
}

/**
 * Get all game recipes
 */
export async function getAllGameRecipes() {
  return prisma.gameRecipe.findMany({
    orderBy: { name: 'asc' },
    include: {
      inputs: {
        include: {
          item: true
        }
      },
      outputs: {
        include: {
          item: true
        }
      },
      producedIn: {
        include: {
          building: true
        }
      }
    }
  });
}

/**
 * Get all game buildings
 */
export async function getAllGameBuildings() {
  return prisma.gameBuilding.findMany({
    orderBy: { name: 'asc' }
  });
}

/**
 * Get a game item by className
 */
export async function getGameItemByClassName(className: string) {
  return prisma.gameItem.findUnique({
    where: { className }
  });
}

/**
 * Get a game recipe by className
 */
export async function getGameRecipeByClassName(className: string) {
  return prisma.gameRecipe.findUnique({
    where: { className },
    include: {
      inputs: {
        include: {
          item: true
        }
      },
      outputs: {
        include: {
          item: true
        }
      },
      producedIn: {
        include: {
          building: true
        }
      }
    }
  });
}

/**
 * Get a game building by className
 */
export async function getGameBuildingByClassName(className: string) {
  return prisma.gameBuilding.findUnique({
    where: { className }
  });
}

/**
 * Get recipes that produce a specific item
 */
export async function getRecipesProducingItem(itemClassName: string) {
  return prisma.gameRecipe.findMany({
    where: {
      outputs: {
        some: {
          itemId: itemClassName
        }
      }
    },
    include: {
      inputs: {
        include: {
          item: true
        }
      },
      outputs: {
        include: {
          item: true
        }
      },
      producedIn: {
        include: {
          building: true
        }
      }
    }
  });
}

/**
 * Get recipes that consume a specific item
 */
export async function getRecipesConsumingItem(itemClassName: string) {
  return prisma.gameRecipe.findMany({
    where: {
      inputs: {
        some: {
          itemId: itemClassName
        }
      }
    },
    include: {
      inputs: {
        include: {
          item: true
        }
      },
      outputs: {
        include: {
          item: true
        }
      },
      producedIn: {
        include: {
          building: true
        }
      }
    }
  });
}

/**
 * Get buildings that can produce a specific recipe
 */
export async function getBuildingsForRecipe(recipeClassName: string) {
  return prisma.gameBuilding.findMany({
    where: {
      recipes: {
        some: {
          recipeId: recipeClassName
        }
      }
    }
  });
}

/**
 * Connect an application Item to a game item
 */
export async function connectItemToGameItem(itemId: string, gameClassName: string) {
  return prisma.item.update({
    where: { id: itemId },
    data: {
      gameClassName
    }
  });
}

/**
 * Connect an application Recipe to a game recipe
 */
export async function connectRecipeToGameRecipe(recipeId: string, gameClassName: string) {
  return prisma.recipe.update({
    where: { id: recipeId },
    data: {
      gameClassName
    }
  });
}

/**
 * Connect an application Building to a game building
 */
export async function connectBuildingToGameBuilding(buildingId: string, gameClassName: string) {
  return prisma.building.update({
    where: { id: buildingId },
    data: {
      gameClassName
    }
  });
}

/**
 * Create an application Item from a game item
 */
export async function createItemFromGameItem(gameClassName: string, category?: string) {
  const gameItem = await getGameItemByClassName(gameClassName);
  
  if (!gameItem) {
    throw new Error(`Game item with className ${gameClassName} not found`);
  }
  
  return prisma.item.create({
    data: {
      name: gameItem.name,
      description: gameItem.description || undefined,
      category: category || undefined,
      gameClassName: gameItem.className
    }
  });
}

/**
 * Create an application Recipe from a game recipe
 */
export async function createRecipeFromGameRecipe(gameClassName: string) {
  const gameRecipe = await getGameRecipeByClassName(gameClassName);
  
  if (!gameRecipe) {
    throw new Error(`Game recipe with className ${gameClassName} not found`);
  }
  
  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      name: gameRecipe.name,
      description: gameRecipe.unlockedBy || undefined,
      craftTime: gameRecipe.duration,
      gameClassName: gameRecipe.className
    }
  });
  
  // For each input and output, we need to find or create the corresponding Item
  for (const input of gameRecipe.inputs) {
    // Find or create the item
    let item = await prisma.item.findFirst({
      where: { gameClassName: input.itemId }
    });
    
    if (!item) {
      item = await createItemFromGameItem(input.itemId);
    }
    
    // Create the recipe item
    await prisma.recipeItem.create({
      data: {
        quantity: input.amount,
        isInput: true,
        recipe: { connect: { id: recipe.id } },
        item: { connect: { id: item.id } }
      }
    });
  }
  
  for (const output of gameRecipe.outputs) {
    // Find or create the item
    let item = await prisma.item.findFirst({
      where: { gameClassName: output.itemId }
    });
    
    if (!item) {
      item = await createItemFromGameItem(output.itemId);
    }
    
    // Create the recipe item
    await prisma.recipeItem.create({
      data: {
        quantity: output.amount,
        isInput: false,
        recipe: { connect: { id: recipe.id } },
        item: { connect: { id: item.id } }
      }
    });
  }
  
  return recipe;
}

/**
 * Create an application Building from a game building
 */
export async function createBuildingFromGameBuilding(gameClassName: string, factoryId: string) {
  const gameBuilding = await getGameBuildingByClassName(gameClassName);
  
  if (!gameBuilding) {
    throw new Error(`Game building with className ${gameClassName} not found`);
  }
  
  return prisma.building.create({
    data: {
      name: gameBuilding.name,
      type: gameBuilding.name,
      factory: { connect: { id: factoryId } },
      gameClassName: gameBuilding.className
    }
  });
}

/**
 * Search for game items by name
 */
export async function searchGameItems(query: string) {
  return prisma.gameItem.findMany({
    where: {
      name: {
        contains: query,
        mode: 'insensitive'
      }
    },
    orderBy: { name: 'asc' }
  });
}

/**
 * Search for game recipes by name
 */
export async function searchGameRecipes(query: string) {
  return prisma.gameRecipe.findMany({
    where: {
      name: {
        contains: query,
        mode: 'insensitive'
      }
    },
    include: {
      inputs: {
        include: {
          item: true
        }
      },
      outputs: {
        include: {
          item: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });
}

/**
 * Search for game buildings by name
 */
export async function searchGameBuildings(query: string) {
  return prisma.gameBuilding.findMany({
    where: {
      name: {
        contains: query,
        mode: 'insensitive'
      }
    },
    orderBy: { name: 'asc' }
  });
} 