import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '~/server/db';

const createVesselSchema = z.object({
  name: z.string().min(1, 'Vessel name is required').max(100, 'Vessel name too long'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1').max(100, 'Capacity cannot exceed 100'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createVesselSchema.parse(body);

    // For now, we'll use the first operator (demo data)
    // In a real app, this would come from the authenticated user's session
    const operator = await db.operator.findFirst();
    
    if (!operator) {
      return NextResponse.json({
        success: false,
        error: 'No operator found',
        message: 'Please ensure you have an operator account set up',
      }, { status: 404 });
    }

    // Check if vessel name already exists for this operator
    const existingVessel = await db.vessel.findFirst({
      where: {
        name: validatedData.name,
        operatorId: operator.id,
      },
    });

    if (existingVessel) {
      return NextResponse.json({
        success: false,
        error: 'Vessel name already exists',
        message: 'A vessel with this name already exists in your fleet',
      }, { status: 409 });
    }

    const vessel = await db.vessel.create({
      data: {
        name: validatedData.name,
        capacity: validatedData.capacity,
        operatorId: operator.id,
      },
      include: {
        operator: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: vessel,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating vessel:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while creating the vessel',
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const vessels = await db.vessel.findMany({
      include: {
        operator: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            scheduledTours: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: vessels,
    });

  } catch (error) {
    console.error('Error fetching vessels:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch vessels',
    }, { status: 500 });
  }
}