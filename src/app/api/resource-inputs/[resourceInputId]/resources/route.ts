import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/resource-inputs/[resourceInputId]/resources - Add an input resource to a resource input
export async function POST(
  request: NextRequest,
  { params }: { params: { resourceInputId: string } }
) {
  try {
    const resourceInputId = params.resourceInputId;
    const body = await request.json();
    const { itemId, rate, resourceNodeId, factoryOriginId } = body;
    
    // Validate required fields
    if (!itemId || rate === undefined) {
      return NextResponse.json(
        { error: 'Item ID and rate are required' },
        { status: 400 }
      );
    }
    
    // Check if resource input exists
    const resourceInput = await prisma.resourceInput.findUnique({
      where: { id: resourceInputId },
    });
    
    if (!resourceInput) {
      return NextResponse.json(
        { error: 'Resource input not found' },
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
    
    // Create new input resource
    const inputResource = await prisma.inputResource.create({
      data: {
        rate,
        itemId,
        resourceInputId,
        resourceNodeId: resourceNodeId || null,
        factoryOriginId: factoryOriginId || null,
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
    
    return NextResponse.json(inputResource, { status: 201 });
  } catch (error) {
    console.error('Error adding input resource:', error);
    return NextResponse.json(
      { error: 'Failed to add input resource' },
      { status: 500 }
    );
  }
} 