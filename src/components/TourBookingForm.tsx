'use client';

import { useState } from 'react';

interface Tour {
  id: string;
  title: string;
  description: string | null;
  price: { toNumber(): number };
  durationInMinutes: number;
  vessel: {
    name: string;
    capacity: number;
  };
}

interface AvailableSchedule {
  id: string;
  startTime: Date;
  availability: {
    totalCapacity: number;
    bookedSeats: number;
    availableSeats: number;
    isFullyBooked: boolean;
  };
}

interface TourBookingFormProps {
  tour: Tour;
  availableSchedules: AvailableSchedule[];
}

export function TourBookingForm({ tour, availableSchedules }: TourBookingFormProps) {
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [passengerCount, setPassengerCount] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedSchedule = availableSchedules.find(s => s.id === selectedScheduleId);
  const maxPassengers = selectedSchedule ? selectedSchedule.availability.availableSeats : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedScheduleId) {
      setError('Please select a departure time');
      return;
    }

    if (passengerCount > maxPassengers) {
      setError(`Only ${maxPassengers} seats available for this departure`);
      return;
    }

    if (!customerName.trim() || !customerEmail.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduledTourId: selectedScheduleId,
          passengerCount,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create booking');
      }

      setSuccess(`Booking confirmed! ${passengerCount} seat${passengerCount > 1 ? 's' : ''} reserved for ${customerName}.`);
      setPassengerCount(1);
      setCustomerName('');
      setCustomerEmail('');
      setSelectedScheduleId('');
      
      // Refresh the page to update availability
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-CA', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-CA', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-vessel-600 to-vessel-700 px-6 py-4">
        <h3 className="text-lg font-semibold text-white">Book Your Adventure</h3>
        <p className="text-vessel-100 text-sm">{tour.title}</p>
      </div>

      <div className="px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Schedule Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Departure Time *
            </label>
            {availableSchedules.length > 0 ? (
              <div className="space-y-2">
                {availableSchedules.map((schedule) => (
                  <label
                    key={schedule.id}
                    className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedScheduleId === schedule.id
                        ? 'border-vessel-500 bg-vessel-50'
                        : 'border-gray-200 hover:border-vessel-300 hover:bg-vessel-25'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="scheduleId"
                        value={schedule.id}
                        checked={selectedScheduleId === schedule.id}
                        onChange={(e) => setSelectedScheduleId(e.target.value)}
                        className="text-vessel-600 focus:ring-vessel-500"
                      />
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatDate(schedule.startTime)} at {formatTime(schedule.startTime)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {schedule.availability.availableSeats} of {schedule.availability.totalCapacity} seats available
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        schedule.availability.availableSeats > 5
                          ? 'bg-green-100 text-green-800'
                          : schedule.availability.availableSeats > 2
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {schedule.availability.availableSeats} left
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Available Departures</h4>
                <p className="text-gray-600">
                  All upcoming tours are fully booked. Please check back later or contact us directly.
                </p>
              </div>
            )}
          </div>

          {/* Customer Information */}
          {selectedScheduleId && (
            <>
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Your Information</h4>
                
                {/* Customer Name */}
                <div className="mb-4">
                  <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-vessel-500 focus:border-vessel-500"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                {/* Customer Email */}
                <div className="mb-4">
                  <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="customerEmail"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-vessel-500 focus:border-vessel-500"
                    placeholder="Enter your email address"
                    required
                  />
                </div>

                {/* Passenger Count */}
                <div>
                  <label htmlFor="passengerCount" className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Passengers
                  </label>
                  <select
                    id="passengerCount"
                    value={passengerCount}
                    onChange={(e) => setPassengerCount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-vessel-500 focus:border-vessel-500"
                  >
                    {Array.from({ length: Math.min(maxPassengers, 10) }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'passenger' : 'passengers'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Booking Summary */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Booking Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tour:</span>
                    <span className="text-gray-900">{tour.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Departure:</span>
                    <span className="text-gray-900">
                      {selectedSchedule && `${formatDate(selectedSchedule.startTime)} at ${formatTime(selectedSchedule.startTime)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Passengers:</span>
                    <span className="text-gray-900">{passengerCount}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-2 border-t border-gray-300">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-vessel-600">${(passengerCount * tour.price.toNumber()).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !selectedScheduleId || availableSchedules.length === 0}
            className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
              isLoading || !selectedScheduleId || availableSchedules.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-vessel-600 hover:bg-vessel-700 focus:outline-none focus:ring-2 focus:ring-vessel-500 focus:ring-offset-2'
            }`}
          >
            {isLoading ? 'Processing...' : availableSchedules.length === 0 ? 'No Departures Available' : 'Book Now'}
          </button>
        </form>
      </div>

      {/* Security Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Secure booking
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Instant confirmation
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            24/7 support
          </div>
        </div>
      </div>
    </div>
  );
}