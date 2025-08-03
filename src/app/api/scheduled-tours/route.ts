import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '~/server/db';

const createScheduledTourSchema = z.object({
  tourId: z.string().min(1, 'Tour ID is required'),
  vesselId: z.string().min(1, 'Vessel ID is required'),
  startTime: z.string().datetime('Invalid date format'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createScheduledTourSchema.parse(body);

    const startTime = new Date(validatedData.startTime);

    // Validate that the start time is in the future
    if (startTime <= new Date()) {
      return NextResponse.json({
        success: false,
        error: 'Invalid start time',
        message: 'Start time must be in the future',
      }, { status: 400 });
    }

    // Use transaction to ensure data integrity
    const result = await db.$transaction(async (tx) => {
      // Verify tour exists
      const tour = await tx.tour.findUnique({
        where: { id: validatedData.tourId },
      });

      if (!tour) {
        throw new Error('Tour not found');
      }

      // Verify vessel exists
      const vessel = await tx.vessel.findUnique({
        where: { id: validatedData.vesselId },
      });

      if (!vessel) {
        throw new Error('Vessel not found');
      }

      // Check for vessel conflicts (same vessel, overlapping time)
      const tourEndTime = new Date(startTime.getTime() + tour.durationInMinutes * 60000);
      
      const conflictingTours = await tx.scheduledTour.findMany({
        where: {
          vesselId: validatedData.vesselId,
          OR: [
            // New tour starts during existing tour
            {
              startTime: { lte: startTime },
              // Calculate end time for existing tours
            },
            // New tour ends during existing tour
            {
              startTime: { lt: tourEndTime },
            },
          ],
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

      // Check for actual time conflicts
      for (const existingTour of conflictingTours) {
        const existingEndTime = new Date(
          existingTour.startTime.getTime() + existingTour.tour.durationInMinutes * 60000
        );

        // Check if times overlap
        const hasConflict = 
          (startTime < existingEndTime && tourEndTime > existingTour.startTime);

        if (hasConflict) {
          throw new Error(
            `Vessel conflict: ${vessel.name} is already scheduled for "${existingTour.tour.title}" from ${existingTour.startTime.toLocaleString()} to ${existingEndTime.toLocaleString()}`
          );
        }
      }

      // Create the scheduled tour
      const scheduledTour = await tx.scheduledTour.create({
        data: {
          tourId: validatedData.tourId,
          vesselId: validatedData.vesselId,
          startTime,
        },
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

      return scheduledTour;
    });

    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating scheduled tour:', error);

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
      if (error.message.includes('Vessel conflict')) {
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
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while creating the scheduled tour',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const vesselId = searchParams.get('vesselId');
    const tourId = searchParams.get('tourId');

    let whereClause: any = {};

    // Date range filtering
    if (startDate || endDate) {
      whereClause.startTime = {};
      if (startDate) {
        whereClause.startTime.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.startTime.lte = new Date(endDate);
      }
    }

    // Vessel filtering
    if (vesselId) {
      whereClause.vesselId = vesselId;
    }

    // Tour filtering
    if (tourId) {
      whereClause.tourId = tourId;
    }

    const scheduledTours = await db.scheduledTour.findMany({
      where: whereClause,
      include: {
        tour: true,
        vessel: true,
        bookings: {
          select: {
            passengerCount: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Calculate availability for each scheduled tour
    const scheduledToursWithAvailability = scheduledTours.map(scheduledTour => {
      const totalBookedSeats = scheduledTour.bookings.reduce(
        (sum, booking) => sum + booking.passengerCount,
        0
      );
      const availableSeats = scheduledTour.vessel.capacity - totalBookedSeats;

      return {
        ...scheduledTour,
        tour: {
          ...scheduledTour.tour,
          price: scheduledTour.tour.price.toNumber(),
        },
        availability: {
          totalCapacity: scheduledTour.vessel.capacity,
          bookedSeats: totalBookedSeats,
          availableSeats,
          isFullyBooked: availableSeats === 0,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: scheduledToursWithAvailability,
    });

  } catch (error) {
    console.error('Error fetching scheduled tours:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch scheduled tours',
    }, { status: 500 });
  }
}