import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '~/server/db';

const updateScheduledTourSchema = z.object({
  tourId: z.string().min(1, 'Tour ID is required').optional(),
  vesselId: z.string().min(1, 'Vessel ID is required').optional(),
  startTime: z.string().datetime('Invalid date format').optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateScheduledTourSchema.parse(body);
    const scheduledTourId = params.id;

    // Use transaction to ensure data integrity
    const result = await db.$transaction(async (tx) => {
      // Get existing scheduled tour
      const existingScheduledTour = await tx.scheduledTour.findUnique({
        where: { id: scheduledTourId },
        include: {
          tour: true,
          vessel: true,
          bookings: {
            select: {
              passengerCount: true,
            },
          },
        },
      });

      if (!existingScheduledTour) {
        throw new Error('Scheduled tour not found');
      }

      // Check if there are existing bookings
      const totalBookedSeats = existingScheduledTour.bookings.reduce(
        (sum, booking) => sum + booking.passengerCount,
        0
      );

      // Prepare update data
      const updateData: any = {};
      let newTour = existingScheduledTour.tour;
      let newVessel = existingScheduledTour.vessel;
      let newStartTime = existingScheduledTour.startTime;

      // Validate and prepare tour change
      if (validatedData.tourId && validatedData.tourId !== existingScheduledTour.tourId) {
        newTour = await tx.tour.findUnique({
          where: { id: validatedData.tourId },
        });

        if (!newTour) {
          throw new Error('New tour not found');
        }

        updateData.tourId = validatedData.tourId;
      }

      // Validate and prepare vessel change
      if (validatedData.vesselId && validatedData.vesselId !== existingScheduledTour.vesselId) {
        newVessel = await tx.vessel.findUnique({
          where: { id: validatedData.vesselId },
        });

        if (!newVessel) {
          throw new Error('New vessel not found');
        }

        // Check if new vessel can accommodate existing bookings
        if (totalBookedSeats > newVessel.capacity) {
          throw new Error(
            `Cannot change vessel: ${totalBookedSeats} seats already booked, but new vessel "${newVessel.name}" only has ${newVessel.capacity} seats`
          );
        }

        updateData.vesselId = validatedData.vesselId;
      }

      // Validate and prepare time change
      if (validatedData.startTime) {
        newStartTime = new Date(validatedData.startTime);

        if (newStartTime <= new Date()) {
          throw new Error('Start time must be in the future');
        }

        updateData.startTime = newStartTime;
      }

      // Check for vessel conflicts if vessel or time is changing
      if (updateData.vesselId || updateData.startTime) {
        const checkVesselId = updateData.vesselId || existingScheduledTour.vesselId;
        const checkStartTime = updateData.startTime || existingScheduledTour.startTime;
        const tourEndTime = new Date(checkStartTime.getTime() + newTour.durationInMinutes * 60000);

        const conflictingTours = await tx.scheduledTour.findMany({
          where: {
            vesselId: checkVesselId,
            id: { not: scheduledTourId }, // Exclude current tour
          },
          include: {
            tour: {
              select: {
                title: true,
                durationInMinutes: true,
              },
            },
          },
        });

        // Check for time conflicts
        for (const conflictingTour of conflictingTours) {
          const conflictingEndTime = new Date(
            conflictingTour.startTime.getTime() + conflictingTour.tour.durationInMinutes * 60000
          );

          const hasConflict = 
            (checkStartTime < conflictingEndTime && tourEndTime > conflictingTour.startTime);

          if (hasConflict) {
            throw new Error(
              `Vessel conflict: ${newVessel.name} is already scheduled for "${conflictingTour.tour.title}" from ${conflictingTour.startTime.toLocaleString()} to ${conflictingEndTime.toLocaleString()}`
            );
          }
        }
      }

      // Update the scheduled tour
      const updatedScheduledTour = await tx.scheduledTour.update({
        where: { id: scheduledTourId },
        data: updateData,
        include: {
          tour: true,
          vessel: true,
          bookings: {
            select: {
              passengerCount: true,
            },
          },
        },
      });

      return updatedScheduledTour;
    });

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        tour: {
          ...result.tour,
          price: result.tour.price.toNumber(),
        },
      },
    });

  } catch (error) {
    console.error('Error updating scheduled tour:', error);

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

    if (error instanceof Error) {
      if (error.message.includes('conflict')) {
        return NextResponse.json({
          success: false,
          error: 'Scheduling conflict',
          message: error.message,
        }, { status: 409 });
      }

      if (error.message.includes('not found')) {
        return NextResponse.json({
          success: false,
          error: 'Resource not found',
          message: error.message,
        }, { status: 404 });
      }

      if (error.message.includes('Cannot change vessel')) {
        return NextResponse.json({
          success: false,
          error: 'Capacity conflict',
          message: error.message,
        }, { status: 409 });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while updating the scheduled tour',
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scheduledTourId = params.id;

    const result = await db.$transaction(async (tx) => {
      // Check if scheduled tour exists
      const existingScheduledTour = await tx.scheduledTour.findUnique({
        where: { id: scheduledTourId },
        include: {
          bookings: {
            select: {
              id: true,
              passengerCount: true,
              customerName: true,
            },
          },
          tour: {
            select: {
              title: true,
            },
          },
        },
      });

      if (!existingScheduledTour) {
        throw new Error('Scheduled tour not found');
      }

      // Check if there are existing bookings
      if (existingScheduledTour.bookings.length > 0) {
        const totalPassengers = existingScheduledTour.bookings.reduce(
          (sum, booking) => sum + booking.passengerCount,
          0
        );

        throw new Error(
          `Cannot delete scheduled tour: ${existingScheduledTour.bookings.length} booking(s) with ${totalPassengers} passenger(s) exist. Please cancel all bookings first.`
        );
      }

      // Delete the scheduled tour
      await tx.scheduledTour.delete({
        where: { id: scheduledTourId },
      });

      return existingScheduledTour;
    });

    return NextResponse.json({
      success: true,
      message: 'Scheduled tour deleted successfully',
      data: {
        deletedTour: result.tour.title,
        startTime: result.startTime,
      },
    });

  } catch (error) {
    console.error('Error deleting scheduled tour:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({
          success: false,
          error: 'Resource not found',
          message: error.message,
        }, { status: 404 });
      }

      if (error.message.includes('Cannot delete')) {
        return NextResponse.json({
          success: false,
          error: 'Cannot delete',
          message: error.message,
        }, { status: 409 });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while deleting the scheduled tour',
    }, { status: 500 });
  }
}