import { NextRequest, NextResponse } from 'next/server';
import * as gameData from '@/lib/gameData';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');
  const query = searchParams.get('query') || '';
  const className = searchParams.get('className');
  
  try {
    // Handle different types of requests
    if (type === 'items') {
      if (className) {
        const item = await gameData.getGameItemByClassName(className);
        return NextResponse.json(item);
      } else if (query) {
        const items = await gameData.searchGameItems(query);
        return NextResponse.json(items);
      } else {
        const items = await gameData.getAllGameItems();
        return NextResponse.json(items);
      }
    } else if (type === 'recipes') {
      if (className) {
        const recipe = await gameData.getGameRecipeByClassName(className);
        return NextResponse.json(recipe);
      } else if (query) {
        const recipes = await gameData.searchGameRecipes(query);
        return NextResponse.json(recipes);
      } else {
        const recipes = await gameData.getAllGameRecipes();
        return NextResponse.json(recipes);
      }
    } else if (type === 'buildings') {
      if (className) {
        const building = await gameData.getGameBuildingByClassName(className);
        return NextResponse.json(building);
      } else if (query) {
        const buildings = await gameData.searchGameBuildings(query);
        return NextResponse.json(buildings);
      } else {
        const buildings = await gameData.getAllGameBuildings();
        return NextResponse.json(buildings);
      }
    } else if (type === 'recipes-producing') {
      if (!className) {
        return NextResponse.json({ error: 'Missing className parameter' }, { status: 400 });
      }
      const recipes = await gameData.getRecipesProducingItem(className);
      return NextResponse.json(recipes);
    } else if (type === 'recipes-consuming') {
      if (!className) {
        return NextResponse.json({ error: 'Missing className parameter' }, { status: 400 });
      }
      const recipes = await gameData.getRecipesConsumingItem(className);
      return NextResponse.json(recipes);
    } else if (type === 'buildings-for-recipe') {
      if (!className) {
        return NextResponse.json({ error: 'Missing className parameter' }, { status: 400 });
      }
      const buildings = await gameData.getBuildingsForRecipe(className);
      return NextResponse.json(buildings);
    } else {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in game-data API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 