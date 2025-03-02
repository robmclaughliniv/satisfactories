import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/factories/[factoryId] - Get a specific factory
export async function GET(
  request: NextRequest,
  { params }: { params: { factoryId: string } }
) {
  try {
    const factoryId = params.factoryId;
    
    const factory = await prisma.factory.findUnique({
      where: { id: factoryId },
      include: {
        world: {
          select: {
            id: true,
            name: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        buildings: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
    
    if (!factory) {
      return NextResponse.json(
        { error: 'Factory not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(factory);
  } catch (error) {
    console.error('Error fetching factory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch factory' },
      { status: 500 }
    );
  }
}

// PUT /api/factories/[factoryId] - Update a factory
export async function PUT(
  request: NextRequest,
  { params }: { params: { factoryId: string } }
) {
  try {
    const factoryId = params.factoryId;
    const body = await request.json();
    const { name, description, location } = body;
    
    // Check if factory exists
    const existingFactory = await prisma.factory.findUnique({
      where: { id: factoryId },
    });
    
    if (!existingFactory) {
      return NextResponse.json(
        { error: 'Factory not found' },
        { status: 404 }
      );
    }
    
    // Update factory
    const updatedFactory = await prisma.factory.update({
      where: { id: factoryId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(location !== undefined && { location }),
      },
    });
    
    return NextResponse.json(updatedFactory);
  } catch (error) {
    console.error('Error updating factory:', error);
    return NextResponse.json(
      { error: 'Failed to update factory' },
      { status: 500 }
    );
  }
}

// DELETE /api/factories/[factoryId] - Delete a factory
export async function DELETE(
  request: NextRequest,
  { params }: { params: { factoryId: string } }
) {
  try {
    const factoryId = params.factoryId;
    
    // Check if factory exists
    const existingFactory = await prisma.factory.findUnique({
      where: { id: factoryId },
    });
    
    if (!existingFactory) {
      return NextResponse.json(
        { error: 'Factory not found' },
        { status: 404 }
      );
    }
    
    // Delete factory
    await prisma.factory.delete({
      where: { id: factoryId },
    });
    
    return NextResponse.json({ message: 'Factory deleted successfully' });
  } catch (error) {
    console.error('Error deleting factory:', error);
    return NextResponse.json(
      { error: 'Failed to delete factory' },
      { status: 500 }
    );
  }
} 