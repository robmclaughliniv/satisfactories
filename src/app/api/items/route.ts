import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/items - Get all items
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    
    const items = await prisma.item.findMany({
      where: query ? {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      } : undefined,
      orderBy: {
        name: 'asc',
      },
    });
    
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
} 