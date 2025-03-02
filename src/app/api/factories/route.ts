import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/factories - Get all factories (optionally filtered by worldId)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const worldId = searchParams.get('worldId');
    
    const factories = await prisma.factory.findMany({
      where: worldId ? { worldId } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        world: {
          select: {
            id: true,
            name: true,
            userId: true,
          },
        },
        buildings: true,
      },
    });
    
    return NextResponse.json(factories);
  } catch (error) {
    console.error('Error fetching factories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch factories' },
      { status: 500 }
    );
  }
}

// POST /api/factories - Create a new factory
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, location, worldId } = body;
    
    // Validate required fields
    if (!name || !worldId) {
      return NextResponse.json(
        { error: 'Name and worldId are required' },
        { status: 400 }
      );
    }
    
    // Check if world exists
    const world = await prisma.world.findUnique({
      where: { id: worldId },
    });
    
    if (!world) {
      return NextResponse.json(
        { error: 'World not found' },
        { status: 404 }
      );
    }
    
    // Create new factory
    const factory = await prisma.factory.create({
      data: {
        name,
        description,
        location,
        worldId,
      },
    });
    
    return NextResponse.json(factory, { status: 201 });
  } catch (error) {
    console.error('Error creating factory:', error);
    return NextResponse.json(
      { error: 'Failed to create factory' },
      { status: 500 }
    );
  }
} 