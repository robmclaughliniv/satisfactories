import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /api/output-resources/[outputResourceId] - Delete an output resource
export async function DELETE(
  request: NextRequest,
  { params }: { params: { outputResourceId: string } }
) {
  try {
    const outputResourceId = params.outputResourceId;
    
    // Check if output resource exists
    const outputResource = await prisma.outputResource.findUnique({
      where: { id: outputResourceId },
    });
    
    if (!outputResource) {
      return NextResponse.json(
        { error: 'Output resource not found' },
        { status: 404 }
      );
    }
    
    // Delete output resource
    await prisma.outputResource.delete({
      where: { id: outputResourceId },
    });
    
    return NextResponse.json({ message: 'Output resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting output resource:', error);
    return NextResponse.json(
      { error: 'Failed to delete output resource' },
      { status: 500 }
    );
  }
}

// PUT /api/output-resources/[outputResourceId] - Update an output resource
export async function PUT(
  request: NextRequest,
  { params }: { params: { outputResourceId: string } }
) {
  try {
    const outputResourceId = params.outputResourceId;
    const body = await request.json();
    const { rate, factoryDestinationId } = body;
    
    // Check if output resource exists
    const outputResource = await prisma.outputResource.findUnique({
      where: { id: outputResourceId },
    });
    
    if (!outputResource) {
      return NextResponse.json(
        { error: 'Output resource not found' },
        { status: 404 }
      );
    }
    
    // Update output resource
    const updatedOutputResource = await prisma.outputResource.update({
      where: { id: outputResourceId },
      data: {
        ...(rate !== undefined && { rate }),
        ...(factoryDestinationId !== undefined && { factoryDestinationId }),
      },
      include: {
        item: true,
        factoryDestination: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    return NextResponse.json(updatedOutputResource);
  } catch (error) {
    console.error('Error updating output resource:', error);
    return NextResponse.json(
      { error: 'Failed to update output resource' },
      { status: 500 }
    );
  }
} 