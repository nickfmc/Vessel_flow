import { BookingForm } from './BookingForm';
import { type Decimal } from '@prisma/client/runtime/library';

import { db } from '~/server/db';

interface ScheduledTourData {
  id: string;
  startTime: Date;
  tour: {
    title: string;
    description: string | null;
    price: Decimal;
    durationInMinutes: number;
  };
  vessel: {
    name: string;
    capacity: number;
  };
  bookings: {
    passengerCount: number;
  }[];
}

interface BookingWidgetProps {
  scheduledTourId?: string;
}

// For demo purposes, using a hardcoded ID if none provided
const DEFAULT_SCHEDULED_TOUR_ID = 'demo-scheduled-tour-id';

async function getScheduledTourData(scheduledTourId: string): Promise<ScheduledTourData | null> {
  try {
    const scheduledTour = await db.scheduledTour.findUnique({
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

    return scheduledTour;
  } catch (error) {
    console.error('Error fetching scheduled tour:', error);
    return null;
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${minutes} minutes`;
  } else if (remainingMinutes === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minutes`;
  }
}

export default async function BookingWidget({ scheduledTourId = DEFAULT_SCHEDULED_TOUR_ID }: BookingWidgetProps) {
  const scheduledTour = await getScheduledTourData(scheduledTourId);

  if (!scheduledTour) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-lg font-medium text-red-800">Tour Not Found</h3>
            <p className="text-sm text-red-600 mt-1">
              The requested tour could not be found or is no longer available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate availability
  const totalBookedSeats = scheduledTour.bookings.reduce(
    (sum, booking) => sum + booking.passengerCount,
    0
  );
  const availableSeats = scheduledTour.vessel.capacity - totalBookedSeats;

  const startDateTime = new Date(scheduledTour.startTime);
  const formattedDate = formatDate(startDateTime);
  const formattedTime = formatTime(startDateTime);
  const formattedDuration = formatDuration(scheduledTour.tour.durationInMinutes);

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <h1 className="text-xl font-bold text-white">{scheduledTour.tour.title}</h1>
        <p className="text-blue-100 text-sm mt-1">
          Booking for {scheduledTour.vessel.name}
        </p>
      </div>

      {/* Tour Details */}
      <div className="px-6 py-4 space-y-3">
        {/* Date & Time */}
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{formattedDate}</p>
            <p className="text-sm text-gray-600">{formattedTime} • {formattedDuration}</p>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              ${scheduledTour.tour.price.toNumber()} per person
            </p>
          </div>
        </div>

        {/* Description */}
        {scheduledTour.tour.description && (
          <div className="pt-2">
            <p className="text-sm text-gray-600">{scheduledTour.tour.description}</p>
          </div>
        )}
      </div>

      {/* Availability Banner */}
      <div className="px-6 py-3 bg-gray-50 border-t border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              <span className={`font-bold ${availableSeats > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {availableSeats > 0 ? `${availableSeats} seats available` : 'Fully booked'}
              </span>
              {' '}out of {scheduledTour.vessel.capacity}
            </p>
            <p className="text-xs text-gray-500">
              {totalBookedSeats} seat{totalBookedSeats !== 1 ? 's' : ''} already booked
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className={`w-3 h-3 rounded-full ${availableSeats > 0 ? 'bg-green-400' : 'bg-red-400'}`}></div>
          </div>
        </div>
      </div>

      {/* Booking Form */}
      <div className="px-6 py-4">
        <BookingForm 
          scheduledTourId={scheduledTour.id}
          availableSeats={availableSeats}
          onBookingSuccess={() => {
            // This would trigger a revalidation in a real app
            // For now, we'll just refresh the page
            window.location.reload();
          }}
        />
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Secure booking • Instant confirmation
        </p>
      </div>
    </div>
  );
}
