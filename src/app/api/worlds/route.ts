import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/worlds - Get all worlds (optionally filtered by userId)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    const worlds = await prisma.world.findMany({
      where: userId ? { userId } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    return NextResponse.json(worlds);
  } catch (error) {
    console.error('Error fetching worlds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch worlds' },
      { status: 500 }
    );
  }
}

// POST /api/worlds - Create a new world
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, userId } = body;
    
    // Validate required fields
    if (!name || !userId) {
      return NextResponse.json(
        { error: 'Name and userId are required' },
        { status: 400 }
      );
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Create new world
    const world = await prisma.world.create({
      data: {
        name,
        description,
        userId,
      },
    });
    
    return NextResponse.json(world, { status: 201 });
  } catch (error) {
    console.error('Error creating world:', error);
    return NextResponse.json(
      { error: 'Failed to create world' },
      { status: 500 }
    );
  }
} 