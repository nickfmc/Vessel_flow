'use client';

import { useState } from 'react';
import { Modal } from "~/components/modals/Modal";
import { TourForm } from "~/components/forms/TourForm";

interface Tour {
  id: string;
  title: string;
  description: string | null;
  price: number;
  durationInMinutes: number;
  operatorId: string;
  createdAt: string;
  updatedAt: string;
  operator: {
    name: string;
  };
  _count: {
    scheduledTours: number;
  };
}

interface ToursClientPageProps {
  tours: Tour[];
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${minutes} min`;
  } else if (remainingMinutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${remainingMinutes}m`;
  }
}

export default function ToursClientPage({ tours }: ToursClientPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<any>(null);
  const [deletingTour, setDeletingTour] = useState<string | null>(null);

  const handleEdit = (tour: any) => {
    setEditingTour(tour);
    setIsModalOpen(true);
  };

  const handleDelete = async (tourId: string) => {
    if (!confirm('Are you sure you want to delete this tour? This action cannot be undone.')) {
      return;
    }

    setDeletingTour(tourId);
    try {
      const response = await fetch(`/api/tours/${tourId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete tour');
      }

      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete tour');
    } finally {
      setDeletingTour(null);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTour(null);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tours</h1>
          <p className="text-gray-600">Manage your tour packages and experiences</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-vessel-600 hover:bg-vessel-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Create New Tour
        </button>
      </div>

      {/* Tours Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tours.map((tour) => (
          <div key={tour.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="p-6">
              {/* Tour Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{tour.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{tour.description}</p>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button 
                    onClick={() => handleEdit(tour)}
                    className="text-gray-400 hover:text-vessel-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleDelete(tour.id)}
                    disabled={deletingTour === tour.id}
                    className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Tour Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Price</span>
                  <span className="font-semibold text-lg text-green-600">
                    ${tour.price}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Duration</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDuration(tour.durationInMinutes)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Scheduled</span>
                  <span className="text-sm font-medium text-gray-900">
                    {tour._count.scheduledTours} tours
                  </span>
                </div>
              </div>

              {/* Status and Actions */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                  <button className="text-vessel-600 hover:text-vessel-700 text-sm font-medium">
                    Schedule Tour
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Tour Card */}
        <div className="bg-white rounded-lg shadow border-2 border-dashed border-gray-300 hover:border-vessel-300 hover:bg-vessel-50 transition-colors">
          <div className="p-6 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Create New Tour</h3>
            <p className="text-sm text-gray-600 mb-4">Design a new tour experience for your customers</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-vessel-600 hover:bg-vessel-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {tours.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No tours yet</h3>
          <p className="text-gray-600 mb-6">Get started by creating your first tour package.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-vessel-600 hover:bg-vessel-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Create Your First Tour
          </button>
        </div>
      )}

      {/* Modal for Add/Edit Tour */}
      <Modal isOpen={isModalOpen} onClose={closeModal} size="lg">
        <TourForm tour={editingTour} onClose={closeModal} />
      </Modal>
    </div>
  );
}