'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface VesselFormProps {
  vessel?: {
    id: string;
    name: string;
    capacity: number;
  };
  onClose?: () => void;
}

export function VesselForm({ vessel, onClose }: VesselFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: vessel?.name || '',
    capacity: vessel?.capacity || 6,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!vessel;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const url = isEditing ? `/api/vessels/${vessel.id}` : '/api/vessels';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save vessel');
      }

      router.refresh();
      if (onClose) {
        onClose();
      } else {
        router.push('/dashboard/vessels');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="c-vessel-form">
      <form onSubmit={handleSubmit} className="c-vessel-form__form">
        <div className="c-vessel-form__header">
          <h2 className="c-vessel-form__title">
            {isEditing ? 'Edit Vessel' : 'Add New Vessel'}
          </h2>
          <p className="c-vessel-form__subtitle">
            {isEditing ? 'Update vessel information' : 'Register a new vessel to your fleet'}
          </p>
        </div>

        <div className="c-vessel-form__fields">
          {/* Vessel Name */}
          <div className="c-vessel-form__field">
            <label htmlFor="name" className="c-vessel-form__label">
              Vessel Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="c-vessel-form__input"
              placeholder="e.g., The Blue Fin"
              required
            />
          </div>

          {/* Capacity */}
          <div className="c-vessel-form__field">
            <label htmlFor="capacity" className="c-vessel-form__label">
              Passenger Capacity *
            </label>
            <input
              type="number"
              id="capacity"
              min="1"
              max="100"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
              className="c-vessel-form__input"
              placeholder="6"
              required
            />
            <p className="c-vessel-form__help-text">
              Maximum number of passengers this vessel can accommodate
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="c-vessel-form__error">
            <p>{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="c-vessel-form__actions">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="c-vessel-form__button c-vessel-form__button--secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || !formData.name.trim() || formData.capacity < 1}
            className="c-vessel-form__button c-vessel-form__button--primary"
          >
            {isLoading ? 'Saving...' : isEditing ? 'Update Vessel' : 'Add Vessel'}
          </button>
        </div>
      </form>
    </div>
  );
}