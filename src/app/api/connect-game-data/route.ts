import { NextRequest, NextResponse } from 'next/server';
import * as gameData from '@/lib/gameData';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, id, gameClassName } = body;
    
    if (!type || !id || !gameClassName) {
      return NextResponse.json(
        { error: 'Missing required parameters: type, id, gameClassName' },
        { status: 400 }
      );
    }
    
    let result;
    
    // Handle different types of connections
    if (type === 'item') {
      result = await gameData.connectItemToGameItem(id, gameClassName);
    } else if (type === 'recipe') {
      result = await gameData.connectRecipeToGameRecipe(id, gameClassName);
    } else if (type === 'building') {
      result = await gameData.connectBuildingToGameBuilding(id, gameClassName);
    } else {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error in connect-game-data API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, gameClassName, factoryId } = body;
    
    if (!type || !gameClassName) {
      return NextResponse.json(
        { error: 'Missing required parameters: type, gameClassName' },
        { status: 400 }
      );
    }
    
    let result;
    
    // Handle different types of creations
    if (type === 'item') {
      result = await gameData.createItemFromGameItem(gameClassName, body.category);
    } else if (type === 'recipe') {
      result = await gameData.createRecipeFromGameRecipe(gameClassName);
    } else if (type === 'building') {
      if (!factoryId) {
        return NextResponse.json(
          { error: 'Missing required parameter: factoryId' },
          { status: 400 }
        );
      }
      result = await gameData.createBuildingFromGameBuilding(gameClassName, factoryId);
    } else {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error in connect-game-data API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 