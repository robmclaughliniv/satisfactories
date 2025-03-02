import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/factories/[factoryId]/resource-outputs - Get all resource outputs for a factory
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
    
    // Get all resource outputs for the factory
    const resourceOutputs = await prisma.resourceOutput.findMany({
      where: { factoryId },
      include: {
        resources: {
          include: {
            item: true,
            factoryDestination: {
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
    
    return NextResponse.json(resourceOutputs);
  } catch (error) {
    console.error('Error fetching resource outputs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resource outputs' },
      { status: 500 }
    );
  }
}

// POST /api/factories/[factoryId]/resource-outputs - Create a new resource output for a factory
export async function POST(
  request: NextRequest,
  { params }: { params: { factoryId: string } }
) {
  try {
    const factoryId = params.factoryId;
    const body = await request.json();
    const { itemId, rate, factoryDestinationId } = body;
    
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
    
    // Create resource output and output resource in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create or find existing resource output
      let resourceOutput = await prisma.resourceOutput.findFirst({
        where: { factoryId },
      });
      
      if (!resourceOutput) {
        resourceOutput = await prisma.resourceOutput.create({
          data: {
            factory: { connect: { id: factoryId } },
          },
        });
      }
      
      // Create output resource
      const outputResource = await prisma.outputResource.create({
        data: {
          rate,
          resourceOutput: { connect: { id: resourceOutput.id } },
          item: { connect: { id: itemId } },
          ...(factoryDestinationId && {
            factoryDestination: { connect: { id: factoryDestinationId } },
          }),
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
      
      return { resourceOutput, outputResource };
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating resource output:', error);
    return NextResponse.json(
      { error: 'Failed to create resource output' },
      { status: 500 }
    );
  }
} 