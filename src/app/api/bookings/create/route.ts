import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '~/server/db';

// Request body validation schema
const createBookingSchema = z.object({
  scheduledTourId: z.string().min(1, 'Scheduled tour ID is required'),
  passengerCount: z.number().int().positive('Passenger count must be a positive integer'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Valid email address is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = createBookingSchema.parse(body);
    
    const { scheduledTourId, passengerCount, customerName, customerEmail } = validatedData;

    // Use Prisma transaction to ensure data integrity and prevent overbooking
    const result = await db.$transaction(async (tx) => {
      // Step 1: Find the scheduled tour with its related vessel
      const scheduledTour = await tx.scheduledTour.findUnique({
        where: { id: scheduledTourId },
        include: {
          vessel: true,
          tour: true,
        },
      });

      if (!scheduledTour) {
        throw new Error('Scheduled tour not found');
      }

      // Step 2: Calculate current booked seats for this scheduled tour
      const currentBookingsAggregate = await tx.booking.aggregate({
        where: { scheduledTourId },
        _sum: {
          passengerCount: true,
        },
      });

      const currentBookedSeats = currentBookingsAggregate._sum.passengerCount ?? 0;
      
      // Step 3: Determine available seats
      const vesselCapacity = scheduledTour.vessel.capacity;
      const availableSeats = vesselCapacity - currentBookedSeats;

      // Step 4: Critical check - prevent overbooking
      if (passengerCount > availableSeats) {
        throw new Error(
          `Not enough seats available. Requested: ${passengerCount}, Available: ${availableSeats}`
        );
      }

      // Step 5: Create the new booking
      const newBooking = await tx.booking.create({
        data: {
          scheduledTourId,
          passengerCount,
          customerName,
          customerEmail,
        },
        include: {
          scheduledTour: {
            include: {
              tour: true,
              vessel: true,
            },
          },
        },
      });

      return {
        booking: newBooking,
        seatsRemaining: availableSeats - passengerCount,
        vesselCapacity,
      };
    });

    // Return success response with booking details
    return NextResponse.json({
      success: true,
      data: {
        booking: {
          id: result.booking.id,
          passengerCount: result.booking.passengerCount,
          customerName: result.booking.customerName,
          customerEmail: result.booking.customerEmail,
          createdAt: result.booking.createdAt,
          scheduledTour: {
            id: result.booking.scheduledTour.id,
            startTime: result.booking.scheduledTour.startTime,
            tour: {
              title: result.booking.scheduledTour.tour.title,
              price: result.booking.scheduledTour.tour.price,
              durationInMinutes: result.booking.scheduledTour.tour.durationInMinutes,
            },
            vessel: {
              name: result.booking.scheduledTour.vessel.name,
              capacity: result.booking.scheduledTour.vessel.capacity,
            },
          },
        },
        inventory: {
          seatsRemaining: result.seatsRemaining,
          totalCapacity: result.vesselCapacity,
          seatsBooked: result.vesselCapacity - result.seatsRemaining,
        },
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating booking:', error);

    // Handle validation errors
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

    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message.includes('Not enough seats available')) {
        return NextResponse.json({
          success: false,
          error: 'Booking conflict',
          message: error.message,
        }, { status: 409 });
      }

      if (error.message.includes('Scheduled tour not found')) {
        return NextResponse.json({
          success: false,
          error: 'Resource not found',
          message: error.message,
        }, { status: 404 });
      }
    }

    // Handle unexpected errors
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while creating the booking',
    }, { status: 500 });
  }
}

// Handle unsupported HTTP methods
export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
    message: 'This endpoint only supports POST requests',
  }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
    message: 'This endpoint only supports POST requests',
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
    message: 'This endpoint only supports POST requests',
  }, { status: 405 });
}
