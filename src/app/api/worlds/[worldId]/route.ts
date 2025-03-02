import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/worlds/[worldId] - Get a specific world
export async function GET(
  request: NextRequest,
  { params }: { params: { worldId: string } }
) {
  try {
    const worldId = params.worldId;
    
    const world = await prisma.world.findUnique({
      where: { id: worldId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        factories: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        resources: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
    
    if (!world) {
      return NextResponse.json(
        { error: 'World not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(world);
  } catch (error) {
    console.error('Error fetching world:', error);
    return NextResponse.json(
      { error: 'Failed to fetch world' },
      { status: 500 }
    );
  }
}

// PUT /api/worlds/[worldId] - Update a world
export async function PUT(
  request: NextRequest,
  { params }: { params: { worldId: string } }
) {
  try {
    const worldId = params.worldId;
    const body = await request.json();
    const { name, description } = body;
    
    // Check if world exists
    const existingWorld = await prisma.world.findUnique({
      where: { id: worldId },
    });
    
    if (!existingWorld) {
      return NextResponse.json(
        { error: 'World not found' },
        { status: 404 }
      );
    }
    
    // Update world
    const updatedWorld = await prisma.world.update({
      where: { id: worldId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
    });
    
    return NextResponse.json(updatedWorld);
  } catch (error) {
    console.error('Error updating world:', error);
    return NextResponse.json(
      { error: 'Failed to update world' },
      { status: 500 }
    );
  }
}

// DELETE /api/worlds/[worldId] - Delete a world
export async function DELETE(
  request: NextRequest,
  { params }: { params: { worldId: string } }
) {
  try {
    const worldId = params.worldId;
    
    // Check if world exists
    const existingWorld = await prisma.world.findUnique({
      where: { id: worldId },
    });
    
    if (!existingWorld) {
      return NextResponse.json(
        { error: 'World not found' },
        { status: 404 }
      );
    }
    
    // Delete world
    await prisma.world.delete({
      where: { id: worldId },
    });
    
    return NextResponse.json({ message: 'World deleted successfully' });
  } catch (error) {
    console.error('Error deleting world:', error);
    return NextResponse.json(
      { error: 'Failed to delete world' },
      { status: 500 }
    );
  }
} 