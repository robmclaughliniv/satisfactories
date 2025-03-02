import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/factories/[factoryId]/resource-inputs - Get all resource inputs for a factory
export async function GET(
  request: NextRequest,
  { params }: { params: { factoryId: string } }
) {
  try {
    const factoryId = params.factoryId;
    
    // Check if factory exists
    const factory = await prisma.factory.findUnique({
      where: { id: factoryId },
    });
    
    if (!factory) {
      return NextResponse.json(
        { error: 'Factory not found' },
        { status: 404 }
      );
    }
    
    // Get all resource inputs for the factory
    const resourceInputs = await prisma.resourceInput.findMany({
      where: { factoryId },
      include: {
        resources: {
          include: {
            item: true,
            factoryOrigin: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(resourceInputs);
  } catch (error) {
    console.error('Error fetching resource inputs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resource inputs' },
      { status: 500 }
    );
  }
}

// POST /api/factories/[factoryId]/resource-inputs - Create a new resource input for a factory
export async function POST(
  request: NextRequest,
  { params }: { params: { factoryId: string } }
) {
  try {
    const factoryId = params.factoryId;
    const body = await request.json();
    const { itemId, rate, factoryOriginId } = body;
    
    // Check if factory exists
    const factory = await prisma.factory.findUnique({
      where: { id: factoryId },
    });
    
    if (!factory) {
      return NextResponse.json(
        { error: 'Factory not found' },
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
    
    // Create resource input and input resource in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create or find existing resource input
      let resourceInput = await prisma.resourceInput.findFirst({
        where: { factoryId },
      });
      
      if (!resourceInput) {
        resourceInput = await prisma.resourceInput.create({
          data: {
            factory: { connect: { id: factoryId } },
          },
        });
      }
      
      // Create input resource
      const inputResource = await prisma.inputResource.create({
        data: {
          rate,
          resourceInput: { connect: { id: resourceInput.id } },
          item: { connect: { id: itemId } },
          ...(factoryOriginId && {
            factoryOrigin: { connect: { id: factoryOriginId } },
          }),
        },
        include: {
          item: true,
          factoryOrigin: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      
      return { resourceInput, inputResource };
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating resource input:', error);
    return NextResponse.json(
      { error: 'Failed to create resource input' },
      { status: 500 }
    );
  }
} 