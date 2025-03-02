import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /api/input-resources/[inputResourceId] - Delete an input resource
export async function DELETE(
  request: NextRequest,
  { params }: { params: { inputResourceId: string } }
) {
  try {
    const inputResourceId = params.inputResourceId;
    
    // Check if input resource exists
    const inputResource = await prisma.inputResource.findUnique({
      where: { id: inputResourceId },
    });
    
    if (!inputResource) {
      return NextResponse.json(
        { error: 'Input resource not found' },
        { status: 404 }
      );
    }
    
    // Delete input resource
    await prisma.inputResource.delete({
      where: { id: inputResourceId },
    });
    
    return NextResponse.json({ message: 'Input resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting input resource:', error);
    return NextResponse.json(
      { error: 'Failed to delete input resource' },
      { status: 500 }
    );
  }
}

// PUT /api/input-resources/[inputResourceId] - Update an input resource
export async function PUT(
  request: NextRequest,
  { params }: { params: { inputResourceId: string } }
) {
  try {
    const inputResourceId = params.inputResourceId;
    const body = await request.json();
    const { rate, resourceNodeId, factoryOriginId } = body;
    
    // Check if input resource exists
    const inputResource = await prisma.inputResource.findUnique({
      where: { id: inputResourceId },
    });
    
    if (!inputResource) {
      return NextResponse.json(
        { error: 'Input resource not found' },
        { status: 404 }
      );
    }
    
    // Update input resource
    const updatedInputResource = await prisma.inputResource.update({
      where: { id: inputResourceId },
      data: {
        ...(rate !== undefined && { rate }),
        ...(resourceNodeId !== undefined && { resourceNodeId }),
        ...(factoryOriginId !== undefined && { factoryOriginId }),
      },
      include: {
        item: true,
        resourceNode: true,
        factoryOrigin: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    return NextResponse.json(updatedInputResource);
  } catch (error) {
    console.error('Error updating input resource:', error);
    return NextResponse.json(
      { error: 'Failed to update input resource' },
      { status: 500 }
    );
  }
} 