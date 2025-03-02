import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/resource-outputs/[resourceOutputId]/resources - Add an output resource to a resource output
export async function POST(
  request: NextRequest,
  { params }: { params: { resourceOutputId: string } }
) {
  try {
    const resourceOutputId = params.resourceOutputId;
    const body = await request.json();
    const { itemId, rate, factoryDestinationId } = body;
    
    // Validate required fields
    if (!itemId || rate === undefined) {
      return NextResponse.json(
        { error: 'Item ID and rate are required' },
        { status: 400 }
      );
    }
    
    // Check if resource output exists
    const resourceOutput = await prisma.resourceOutput.findUnique({
      where: { id: resourceOutputId },
    });
    
    if (!resourceOutput) {
      return NextResponse.json(
        { error: 'Resource output not found' },
        { status: 404 }
      );
    }
    
    // Check if item exists
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });
    
    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }
    
    // Create new output resource
    const outputResource = await prisma.outputResource.create({
      data: {
        rate,
        itemId,
        resourceOutputId,
        factoryDestinationId: factoryDestinationId || null,
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
    
    return NextResponse.json(outputResource, { status: 201 });
  } catch (error) {
    console.error('Error adding output resource:', error);
    return NextResponse.json(
      { error: 'Failed to add output resource' },
      { status: 500 }
    );
  }
} 