import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/resources - Get all resources (optionally filtered by worldId)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const worldId = searchParams.get('worldId');
    
    const resources = await prisma.resource.findMany({
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
      },
    });
    
    return NextResponse.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

// POST /api/resources - Create a new resource
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, purity, location, worldId } = body;
    
    // Validate required fields
    if (!type || !purity || !worldId) {
      return NextResponse.json(
        { error: 'Type, purity, and worldId are required' },
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
    
    // Create new resource
    const resource = await prisma.resource.create({
      data: {
        type,
        purity,
        location,
        worldId,
      },
    });
    
    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    console.error('Error creating resource:', error);
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    );
  }
} 