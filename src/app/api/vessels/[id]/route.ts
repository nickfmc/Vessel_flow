import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '~/server/db';

const updateVesselSchema = z.object({
  name: z.string().min(1, 'Vessel name is required').max(100, 'Vessel name too long'),
  type: z.enum(['FISHING_BOAT', 'ZODIAC', 'COVERED_VESSEL'], {
    errorMap: () => ({ message: 'Please select a valid vessel type' })
  }),
  capacity: z.number().int().min(1, 'Capacity must be at least 1').max(100, 'Capacity cannot exceed 100'),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateVesselSchema.parse(body);
    const vesselId = params.id;

    // Check if vessel exists
    const existingVessel = await db.vessel.findUnique({
      where: { id: vesselId },
      include: {
        operator: true,
      },
    });

    if (!existingVessel) {
      return NextResponse.json({
        success: false,
        error: 'Vessel not found',
        message: 'The specified vessel does not exist',
      }, { status: 404 });
    }

    // Check if new name conflicts with another vessel (excluding current vessel)
    const nameConflict = await db.vessel.findFirst({
      where: {
        name: validatedData.name,
        operatorId: existingVessel.operatorId,
        id: { not: vesselId },
      },
    });

    if (nameConflict) {
      return NextResponse.json({
        success: false,
        error: 'Vessel name already exists',
        message: 'Another vessel with this name already exists in your fleet',
      }, { status: 409 });
    }

    // Check if reducing capacity would affect existing bookings
    if (validatedData.capacity < existingVessel.capacity) {
      const maxBookedSeats = await db.scheduledTour.findMany({
        where: {
          vesselId: vesselId,
          startTime: { gte: new Date() }, // Only future tours
        },
        include: {
          bookings: {
            select: {
              passengerCount: true,
            },
          },
        },
      });

      const maxSeatsNeeded = Math.max(
        ...maxBookedSeats.map(tour => 
          tour.bookings.reduce((sum, booking) => sum + booking.passengerCount, 0)
        ),
        0
      );

      if (validatedData.capacity < maxSeatsNeeded) {
        return NextResponse.json({
          success: false,
          error: 'Capacity too low',
          message: `Cannot reduce capacity below ${maxSeatsNeeded} seats due to existing bookings`,
        }, { status: 409 });
      }
    }

    const updatedVessel = await db.vessel.update({
      where: { id: vesselId },
      data: {
        name: validatedData.name,
        type: validatedData.type,
        capacity: validatedData.capacity,
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
      data: updatedVessel,
    });

  } catch (error) {
    console.error('Error updating vessel:', error);

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
      message: 'An unexpected error occurred while updating the vessel',
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vesselId = params.id;

    // Check if vessel exists
    const existingVessel = await db.vessel.findUnique({
      where: { id: vesselId },
      include: {
        _count: {
          select: {
            scheduledTours: true,
          },
        },
      },
    });

    if (!existingVessel) {
      return NextResponse.json({
        success: false,
        error: 'Vessel not found',
        message: 'The specified vessel does not exist',
      }, { status: 404 });
    }

    // Check if vessel has scheduled tours
    if (existingVessel._count.scheduledTours > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete vessel',
        message: 'This vessel has scheduled tours and cannot be deleted. Please remove all scheduled tours first.',
      }, { status: 409 });
    }

    await db.vessel.delete({
      where: { id: vesselId },
    });

    return NextResponse.json({
      success: true,
      message: 'Vessel deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting vessel:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while deleting the vessel',
    }, { status: 500 });
  }
}