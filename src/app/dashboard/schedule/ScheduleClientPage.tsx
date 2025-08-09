'use client';

import { useState } from 'react';
import { Modal } from "~/components/modals/Modal";
import { ScheduledTourForm } from "~/components/forms/ScheduledTourForm";
import { BulkScheduleForm } from "~/components/forms/BulkScheduleForm";
import { ScheduleCalendar } from "~/components/calendar/ScheduleCalendar";
import { BookingLinkGenerator } from "~/components/BookingLinkGenerator";

interface Tour {
  id: string;
  title: string;
  price: number;
  durationInMinutes: number;
}

interface Vessel {
  id: string;
  name: string;
  capacity: number;
}

interface ScheduledTour {
  id: string;
  tourId: string;
  vesselId: string;
  startTime: string;
  tour: {
    id: string;
    title: string;
    description: string | null;
    price: number;
    durationInMinutes: number;
  };
  vessel: {
    id: string;
    name: string;
    capacity: number;
  };
  availability: {
    totalCapacity: number;
    bookedSeats: number;
    availableSeats: number;
    isFullyBooked: boolean;
  };
}

interface ScheduleClientPageProps {
  scheduledTours: ScheduledTour[];
  tours: Tour[];
  vessels: Vessel[];
  companySlug: string;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-CA', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${minutes}m`;
  } else if (remainingMinutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${remainingMinutes}m`;
  }
}

export default function ScheduleClientPage({ scheduledTours, tours, vessels, companySlug }: ScheduleClientPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingScheduledTour, setEditingScheduledTour] = useState<any>(null);
  const [deletingScheduledTour, setDeletingScheduledTour] = useState<string | null>(null);
  const [showingBookingLink, setShowingBookingLink] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const handleEdit = (scheduledTour: ScheduledTour) => {
    setEditingScheduledTour({
      id: scheduledTour.id,
      tourId: scheduledTour.tourId,
      vesselId: scheduledTour.vesselId,
      startTime: scheduledTour.startTime,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (scheduledTourId: string) => {
    const scheduledTour = scheduledTours.find(st => st.id === scheduledTourId);
    if (!scheduledTour) return;

    const confirmMessage = scheduledTour.availability.bookedSeats > 0
      ? `This tour has ${scheduledTour.availability.bookedSeats} passenger(s) booked. Are you sure you want to delete it? This will cancel all bookings.`
      : 'Are you sure you want to delete this scheduled tour?';

    if (!confirm(confirmMessage)) {
      return;
    }

    setDeletingScheduledTour(scheduledTourId);
    try {
      const response = await fetch(`/api/scheduled-tours/${scheduledTourId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete scheduled tour');
      }

      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete scheduled tour');
    } finally {
      setDeletingScheduledTour(null);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingScheduledTour(null);
  };

  const closeBulkModal = () => {
    setIsBulkModalOpen(false);
  };

  const handleTourClick = (tour: ScheduledTour) => {
    handleEdit(tour);
  };

  // Group scheduled tours by date
  const groupedTours = scheduledTours.reduce((groups, scheduledTour) => {
    const date = formatDate(scheduledTour.startTime);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(scheduledTour);
    return groups;
  }, {} as Record<string, ScheduledTour[]>);

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-600">Manage tour departures and vessel assignments</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Calendar
            </button>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-vessel-600 hover:bg-vessel-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Schedule New Tour
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Scheduled Tours</p>
              <p className="text-2xl font-bold text-gray-900">{scheduledTours.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available Seats</p>
              <p className="text-2xl font-bold text-gray-900">
                {scheduledTours.reduce((sum, st) => sum + st.availability.availableSeats, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Booked Seats</p>
              <p className="text-2xl font-bold text-gray-900">
                {scheduledTours.reduce((sum, st) => sum + st.availability.bookedSeats, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Fully Booked</p>
              <p className="text-2xl font-bold text-gray-900">
                {scheduledTours.filter(st => st.availability.isFullyBooked).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Content */}
      {viewMode === 'calendar' ? (
        <ScheduleCalendar 
          scheduledTours={scheduledTours}
          onTourClick={handleTourClick}
        />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Departures</h2>
          </div>

          {Object.keys(groupedTours).length > 0 ? (
            <div className="divide-y divide-gray-200">
              {Object.entries(groupedTours).map(([date, tours]) => (
                <div key={date} className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{date}</h3>
                  <div className="space-y-4">
                    {tours.map((scheduledTour) => (
                      <div key={scheduledTour.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="text-lg font-bold text-vessel-600">
                                {formatTime(scheduledTour.startTime)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatDuration(scheduledTour.tour.durationInMinutes)}
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{scheduledTour.tour.title}</h4>
                              <p className="text-sm text-gray-600">
                                {scheduledTour.vessel.name} • ${scheduledTour.tour.price} per person
                              </p>
                            </div>

                            <div className="text-right">
                              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                scheduledTour.availability.isFullyBooked
                                  ? 'bg-red-100 text-red-800'
                                  : scheduledTour.availability.availableSeats <= 2
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {scheduledTour.availability.availableSeats} / {scheduledTour.availability.totalCapacity} available
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {scheduledTour.availability.bookedSeats} booked
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <button 
                            onClick={() => handleEdit(scheduledTour)}
                            className="text-gray-400 hover:text-vessel-600 p-2"
                            title="Edit scheduled tour"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => setShowingBookingLink(scheduledTour.id)}
                            className="text-gray-400 hover:text-blue-600 p-2"
                            title="Get booking link"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDelete(scheduledTour.id)}
                            disabled={deletingScheduledTour === scheduledTour.id}
                            className="text-gray-400 hover:text-red-600 disabled:opacity-50 p-2"
                            title="Delete scheduled tour"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        {/* Booking Link Generator */}
                        {showingBookingLink === scheduledTour.id && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <BookingLinkGenerator
                              companySlug={companySlug}
                              scheduledTourId={scheduledTour.id}
                              tourTitle={scheduledTour.tour.title}
                            />
                            <button
                              onClick={() => setShowingBookingLink(null)}
                              className="mt-2 text-xs text-gray-500 hover:text-gray-700"
                            >
                              Hide link
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No scheduled tours</h3>
              <p className="text-gray-600 mb-6">Get started by scheduling your first tour departure.</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-vessel-600 hover:bg-vessel-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Schedule Your First Tour
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick Schedule Actions */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-vessel-300 hover:bg-vessel-50 transition-colors"
          >
            <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <p className="text-sm font-medium text-gray-900">Schedule Tour</p>
            <p className="text-xs text-gray-500">Create a new departure time</p>
          </button>

          <button 
            onClick={() => setIsBulkModalOpen(true)}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-vessel-300 hover:bg-vessel-50 transition-colors"
          >
            <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium text-gray-900">Bulk Schedule</p>
            <p className="text-xs text-gray-500">Schedule multiple departures</p>
          </button>

          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-vessel-300 hover:bg-vessel-50 transition-colors">
            <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm font-medium text-gray-900">View Analytics</p>
            <p className="text-xs text-gray-500">Schedule performance metrics</p>
          </button>
        </div>
      </div>

      {/* Modal for Add/Edit Scheduled Tour */}
      <Modal isOpen={isModalOpen} onClose={closeModal} size="lg">
        <ScheduledTourForm 
          scheduledTour={editingScheduledTour} 
          tours={tours}
          vessels={vessels}
          onClose={closeModal} 
        />
      </Modal>

      {/* Modal for Bulk Schedule */}
      <Modal isOpen={isBulkModalOpen} onClose={closeBulkModal} size="xl">
        <BulkScheduleForm 
          tours={tours}
          vessels={vessels}
          onClose={closeBulkModal} 
        />
      </Modal>
    </div>
  );
}