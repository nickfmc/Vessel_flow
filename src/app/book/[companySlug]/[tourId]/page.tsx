import { notFound } from 'next/navigation';
import { db } from '~/server/db';
import { TourBookingForm } from '~/components/TourBookingForm';

interface BookingPageProps {
  params: {
    companySlug: string;
    tourId: string;
  };
}

async function getBookingData(companySlug: string, tourId: string) {
  try {
    // Find operator by slug
    const operator = await db.operator.findFirst({
      where: {
        name: {
          contains: companySlug.replace('-', ' '),
          mode: 'insensitive',
        },
      },
    });

    if (!operator) {
      return null;
    }

    // Get tour data with available schedules
    const tour = await db.tour.findUnique({
      where: { 
        id: tourId,
      },
      include: {
        operator: true,
        scheduledTours: {
          where: {
            startTime: {
              gte: new Date(), // Only future tours
            },
          },
          include: {
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
        },
      },
    });

    // Verify the tour belongs to this operator
    if (!tour || tour.operatorId !== operator.id) {
      return null;
    }

    return {
      operator,
      tour,
    };
  } catch (error) {
    console.error('Error fetching booking data:', error);
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

export default async function BookingPage({ params }: BookingPageProps) {
  const data = await getBookingData(params.companySlug, params.tourId);

  if (!data) {
    notFound();
  }

  const { operator, tour } = data;

  // Calculate availability for each scheduled tour
  const availableSchedules = tour.scheduledTours.map(scheduledTour => {
    const totalBookedSeats = scheduledTour.bookings.reduce(
      (sum, booking) => sum + booking.passengerCount,
      0
    );
    const availableSeats = scheduledTour.vessel.capacity - totalBookedSeats;

    return {
      ...scheduledTour,
      availability: {
        totalCapacity: scheduledTour.vessel.capacity,
        bookedSeats: totalBookedSeats,
        availableSeats,
        isFullyBooked: availableSeats === 0,
      },
    };
  }).filter(schedule => !schedule.availability.isFullyBooked);

  const formattedDuration = formatDuration(tour.durationInMinutes);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-vessel-600">{operator.name}</h1>
              <p className="text-sm text-gray-600">Marine Tours & Charters</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Secure Booking</p>
              <div className="flex items-center text-green-600">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-xs font-medium">SSL Protected</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tour Information */}
          <div className="space-y-6">
            {/* Tour Details Card */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-vessel-600 to-vessel-700 px-6 py-4">
                <h2 className="text-xl font-bold text-white">{tour.title}</h2>
                <p className="text-vessel-100 text-sm mt-1">
                  Marine Adventure Experience
                </p>
              </div>

              <div className="px-6 py-4 space-y-4">
                {/* Duration */}
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Duration: {formattedDuration}</p>
                    <p className="text-sm text-gray-600">Full tour experience</p>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 p-2 bg-green-100 rounded-lg">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      ${tour.price.toNumber()} per person
                    </p>
                    <p className="text-sm text-gray-600">All equipment included</p>
                  </div>
                </div>

                {/* Vessel Info */}
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 p-2 bg-vessel-100 rounded-lg">
                    <svg className="w-5 h-5 text-vessel-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12c0 1.657-4.03 3-9 3s-9-1.343-9-3m18 0c0 1.657-4.03 3-9 3s-9-1.343-9-3m18 0V9c0-1.657-4.03-3-9-3S3 7.343 3 9v3m18 0V15" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Professional Vessels</p>
                    <p className="text-sm text-gray-600">Modern, well-maintained fleet</p>
                  </div>
                </div>

                {/* Description */}
                {tour.description && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-gray-700 leading-relaxed">{tour.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Company Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About {operator.name}</h3>
              <div className="space-y-3">
                {operator.phone && (
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-gray-700">{operator.phone}</span>
                  </div>
                )}
                {operator.address && (
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-700">{operator.address}</span>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-700">{operator.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div className="lg:sticky lg:top-8">
            <TourBookingForm 
              tour={tour}
              availableSchedules={availableSchedules}
            />
          </div>
        </div>
      </main>
    </div>
  );
}