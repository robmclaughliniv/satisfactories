import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/resource-outputs - Create a new resource output
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { factoryId, name, description } = body;
    
    // Validate required fields
    if (!factoryId) {
      return NextResponse.json(
        { error: 'Factory ID is required' },
        { status: 400 }
      );
    }
    
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
    
    // Create new resource output
    const resourceOutput = await prisma.resourceOutput.create({
      data: {
        factoryId,
        name: name || null,
        description: description || null,
      },
    });
    
    return NextResponse.json(resourceOutput, { status: 201 });
  } catch (error) {
    console.error('Error creating resource output:', error);
    return NextResponse.json(
      { error: 'Failed to create resource output' },
      { status: 500 }
    );
  }
} 