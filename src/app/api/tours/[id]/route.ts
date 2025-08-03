import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '~/server/db';

const updateTourSchema = z.object({
  title: z.string().min(1, 'Tour title is required').max(200, 'Tour title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  price: z.number().positive('Price must be positive').max(10000, 'Price too high'),
  durationInMinutes: z.number().int().min(30, 'Duration must be at least 30 minutes').max(1440, 'Duration cannot exceed 24 hours'),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateTourSchema.parse(body);
    const tourId = params.id;

    // Check if tour exists
    const existingTour = await db.tour.findUnique({
      where: { id: tourId },
      include: {
        operator: true,
      },
    });

    if (!existingTour) {
      return NextResponse.json({
        success: false,
        error: 'Tour not found',
        message: 'The specified tour does not exist',
      }, { status: 404 });
    }

    // Check if new title conflicts with another tour (excluding current tour)
    const titleConflict = await db.tour.findFirst({
      where: {
        title: validatedData.title,
        operatorId: existingTour.operatorId,
        id: { not: tourId },
      },
    });

    if (titleConflict) {
      return NextResponse.json({
        success: false,
        error: 'Tour title already exists',
        message: 'Another tour with this title already exists in your catalog',
      }, { status: 409 });
    }

    const updatedTour = await db.tour.update({
      where: { id: tourId },
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        price: validatedData.price,
        durationInMinutes: validatedData.durationInMinutes,
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
      data: updatedTour,
    });

  } catch (error) {
    console.error('Error updating tour:', error);

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
      message: 'An unexpected error occurred while updating the tour',
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tourId = params.id;

    // Check if tour exists
    const existingTour = await db.tour.findUnique({
      where: { id: tourId },
      include: {
        _count: {
          select: {
            scheduledTours: true,
          },
        },
      },
    });

    if (!existingTour) {
      return NextResponse.json({
        success: false,
        error: 'Tour not found',
        message: 'The specified tour does not exist',
      }, { status: 404 });
    }

    // Check if tour has scheduled instances
    if (existingTour._count.scheduledTours > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete tour',
        message: 'This tour has scheduled instances and cannot be deleted. Please remove all scheduled tours first.',
      }, { status: 409 });
    }

    await db.tour.delete({
      where: { id: tourId },
    });

    return NextResponse.json({
      success: true,
      message: 'Tour deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting tour:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while deleting the tour',
    }, { status: 500 });
  }
}