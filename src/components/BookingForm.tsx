'use client';

import { useState } from 'react';

interface BookingFormProps {
  scheduledTourId: string;
  availableSeats: number;
  onBookingSuccess: () => void;
}

export function BookingForm({ scheduledTourId, availableSeats, onBookingSuccess }: BookingFormProps) {
  const [passengerCount, setPassengerCount] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passengerCount > availableSeats) {
      setError(`Only ${availableSeats} seats available`);
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
          scheduledTourId,
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
      onBookingSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Customer Name */}
      <div>
        <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name *
        </label>
        <input
          type="text"
          id="customerName"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your full name"
          required
        />
      </div>

      {/* Customer Email */}
      <div>
        <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address *
        </label>
        <input
          type="email"
          id="customerEmail"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {Array.from({ length: Math.min(availableSeats, 10) }, (_, i) => i + 1).map((num) => (
            <option key={num} value={num}>
              {num} {num === 1 ? 'passenger' : 'passengers'}
            </option>
          ))}
        </select>
      </div>

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
        disabled={isLoading || availableSeats === 0}
        className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
          isLoading || availableSeats === 0
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        }`}
      >
        {isLoading ? 'Processing...' : availableSeats === 0 ? 'Fully Booked' : 'Book Now'}
      </button>
    </form>
  );
}
