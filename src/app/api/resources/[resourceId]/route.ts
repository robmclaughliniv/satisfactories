import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/resources/[resourceId] - Get a specific resource
export async function GET(
  request: NextRequest,
  { params }: { params: { resourceId: string } }
) {
  try {
    const resourceId = params.resourceId;
    
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
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
      },
    });
    
    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(resource);
  } catch (error) {
    console.error('Error fetching resource:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resource' },
      { status: 500 }
    );
  }
}

// PUT /api/resources/[resourceId] - Update a resource
export async function PUT(
  request: NextRequest,
  { params }: { params: { resourceId: string } }
) {
  try {
    const resourceId = params.resourceId;
    const body = await request.json();
    const { type, purity, location } = body;
    
    // Check if resource exists
    const existingResource = await prisma.resource.findUnique({
      where: { id: resourceId },
    });
    
    if (!existingResource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }
    
    // Update resource
    const updatedResource = await prisma.resource.update({
      where: { id: resourceId },
      data: {
        ...(type && { type }),
        ...(purity && { purity }),
        ...(location !== undefined && { location }),
      },
    });
    
    return NextResponse.json(updatedResource);
  } catch (error) {
    console.error('Error updating resource:', error);
    return NextResponse.json(
      { error: 'Failed to update resource' },
      { status: 500 }
    );
  }
}

// DELETE /api/resources/[resourceId] - Delete a resource
export async function DELETE(
  request: NextRequest,
  { params }: { params: { resourceId: string } }
) {
  try {
    const resourceId = params.resourceId;
    
    // Check if resource exists
    const existingResource = await prisma.resource.findUnique({
      where: { id: resourceId },
    });
    
    if (!existingResource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }
    
    // Delete resource
    await prisma.resource.delete({
      where: { id: resourceId },
    });
    
    return NextResponse.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    return NextResponse.json(
      { error: 'Failed to delete resource' },
      { status: 500 }
    );
  }
} 