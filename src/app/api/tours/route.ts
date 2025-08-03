import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '~/server/db';

const createTourSchema = z.object({
  title: z.string().min(1, 'Tour title is required').max(200, 'Tour title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  price: z.number().positive('Price must be positive').max(10000, 'Price too high'),
  durationInMinutes: z.number().int().min(30, 'Duration must be at least 30 minutes').max(1440, 'Duration cannot exceed 24 hours'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createTourSchema.parse(body);

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

    // Check if tour title already exists for this operator
    const existingTour = await db.tour.findFirst({
      where: {
        title: validatedData.title,
        operatorId: operator.id,
      },
    });

    if (existingTour) {
      return NextResponse.json({
        success: false,
        error: 'Tour title already exists',
        message: 'A tour with this title already exists in your catalog',
      }, { status: 409 });
    }

    const tour = await db.tour.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        price: validatedData.price,
        durationInMinutes: validatedData.durationInMinutes,
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
      data: tour,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating tour:', error);

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
      message: 'An unexpected error occurred while creating the tour',
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const tours = await db.tour.findMany({
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
      data: tours,
    });

  } catch (error) {
    console.error('Error fetching tours:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch tours',
    }, { status: 500 });
  }
}