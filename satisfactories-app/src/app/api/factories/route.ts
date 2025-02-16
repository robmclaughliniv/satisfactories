import { NextResponse } from 'next/server';
import db from '../../../services/db';

// GET: Retrieve all factories
export async function GET(request: Request) {
  try {
    const result = await db.query('SELECT * FROM factories');
    return NextResponse.json({ factories: result.rows });
  } catch (error) {
    console.error('Error fetching factories:', error);
    return NextResponse.json({ error: 'Failed to fetch factories' }, { status: 500 });
  }
}

// POST: Create a new factory
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      world_id,
      name,
      operational_status,
      location,
      power_management,
      building_counts,
      efficiency_tracking,
    } = body;

    if (!world_id || !name) {
      return NextResponse.json({ error: 'world_id and name are required fields.' }, { status: 400 });
    }

    const queryText = `
      INSERT INTO factories (world_id, name, operational_status, location, power_management, building_counts, efficiency_tracking)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `;
    const values = [
      world_id,
      name,
      operational_status,
      location,
      JSON.stringify(power_management || {}),
      JSON.stringify(building_counts || {}),
      JSON.stringify(efficiency_tracking || {})
    ];

    const result = await db.query(queryText, values);
    return NextResponse.json({ factory: result.rows[0] });
  } catch (error) {
    console.error('Error creating factory:', error);
    return NextResponse.json({ error: 'Failed to create factory.' }, { status: 500 });
  }
}

// PUT: Update an existing factory
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      world_id,
      name,
      operational_status,
      location,
      power_management,
      building_counts,
      efficiency_tracking,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Factory id is required for update.' }, { status: 400 });
    }

    const queryText = `
      UPDATE factories
      SET world_id = $1,
          name = $2,
          operational_status = $3,
          location = $4,
          power_management = $5,
          building_counts = $6,
          efficiency_tracking = $7
      WHERE id = $8
      RETURNING *
    `;
    const values = [
      world_id,
      name,
      operational_status,
      location,
      JSON.stringify(power_management || {}),
      JSON.stringify(building_counts || {}),
      JSON.stringify(efficiency_tracking || {}),
      id
    ];

    const result = await db.query(queryText, values);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Factory not found.' }, { status: 404 });
    }
    return NextResponse.json({ factory: result.rows[0] });
  } catch (error) {
    console.error('Error updating factory:', error);
    return NextResponse.json({ error: 'Failed to update factory.' }, { status: 500 });
  }
}

// DELETE: Remove a factory
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: 'Factory id is required for deletion.' }, { status: 400 });
    }
    const result = await db.query('DELETE FROM factories WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Factory not found.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Factory deleted successfully.' });
  } catch (error) {
    console.error('Error deleting factory:', error);
    return NextResponse.json({ error: 'Failed to delete factory.' }, { status: 500 });
  }
}
