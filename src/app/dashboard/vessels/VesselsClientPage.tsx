'use client';

import { useState } from 'react';
import { Modal } from "~/components/modals/Modal";
import { VesselForm } from "~/components/forms/VesselForm";

interface Vessel {
  id: string;
  name: string;
  capacity: number;
  operatorId: string;
  createdAt: Date;
  updatedAt: Date;
  operator: {
    name: string;
  };
  _count: {
    scheduledTours: number;
  };
}

interface VesselsClientPageProps {
  vessels: Vessel[];
}

export default function VesselsClientPage({ vessels }: VesselsClientPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVessel, setEditingVessel] = useState<any>(null);
  const [deletingVessel, setDeletingVessel] = useState<string | null>(null);

  const handleEdit = (vessel: any) => {
    setEditingVessel(vessel);
    setIsModalOpen(true);
  };

  const handleDelete = async (vesselId: string) => {
    if (!confirm('Are you sure you want to delete this vessel? This action cannot be undone.')) {
      return;
    }

    setDeletingVessel(vesselId);
    try {
      const response = await fetch(`/api/vessels/${vesselId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete vessel');
      }

      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete vessel');
    } finally {
      setDeletingVessel(null);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingVessel(null);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vessels</h1>
          <p className="text-gray-600">Manage your fleet of vessels and boats</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-vessel-600 hover:bg-vessel-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Add New Vessel
        </button>
      </div>

      {/* Vessels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vessels.map((vessel) => (
          <div key={vessel.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="p-6">
              {/* Vessel Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{vessel.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Operated by {vessel.operator.name}
                  </p>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button 
                    onClick={() => handleEdit(vessel)}
                    className="text-gray-400 hover:text-vessel-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleDelete(vessel.id)}
                    disabled={deletingVessel === vessel.id}
                    className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Vessel Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Capacity</span>
                  <span className="font-semibold text-lg text-blue-600">
                    {vessel.capacity} passengers
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Scheduled Tours</span>
                  <span className="text-sm font-medium text-gray-900">
                    {vessel._count.scheduledTours} tours
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
                    View Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Vessel Card */}
        <div className="bg-white rounded-lg shadow border-2 border-dashed border-gray-300 hover:border-vessel-300 hover:bg-vessel-50 transition-colors">
          <div className="p-6 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Add New Vessel</h3>
            <p className="text-sm text-gray-600 mb-4">Register a new boat to your fleet</p>
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
      {vessels.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12c0 1.657-4.03 3-9 3s-9-1.343-9-3m18 0c0 1.657-4.03 3-9 3s-9-1.343-9-3m18 0V9c0-1.657-4.03-3-9-3S3 7.343 3 9v3m18 0V15" />
          </svg>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No vessels yet</h3>
          <p className="text-gray-600 mb-6">Get started by adding your first vessel to the fleet.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-vessel-600 hover:bg-vessel-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Add Your First Vessel
          </button>
        </div>
      )}

      {/* Modal for Add/Edit Vessel */}
      <Modal isOpen={isModalOpen} onClose={closeModal} size="md">
        <VesselForm vessel={editingVessel} onClose={closeModal} />
      </Modal>
    </div>
  );
}