'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VesselTypeIcon } from '~/components/icons/VesselTypeIcon';

type VesselType = 'FISHING_BOAT' | 'ZODIAC' | 'COVERED_VESSEL';

const vesselTypeOptions = [
  { value: 'FISHING_BOAT', label: 'Fishing Boat', description: 'Traditional fishing vessel' },
  { value: 'ZODIAC', label: 'Zodiac', description: 'Inflatable boat for adventure tours' },
  { value: 'COVERED_VESSEL', label: 'Covered Vessel', description: 'Enclosed boat with weather protection' },
] as const;

interface VesselFormProps {
  vessel?: {
    id: string;
    name: string;
    type: VesselType;
    capacity: number;
  };
  onClose?: () => void;
}

export function VesselForm({ vessel, onClose }: VesselFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: vessel?.name || '',
    type: vessel?.type || 'FISHING_BOAT' as VesselType,
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

          {/* Vessel Type */}
          <div className="c-vessel-form__field">
            <label className="c-vessel-form__label">
              Vessel Type *
            </label>
            <div className="c-vessel-form__vessel-types">
              {vesselTypeOptions.map((option) => (
                <label
                  key={option.value}
                  className={`c-vessel-form__vessel-type ${
                    formData.type === option.value ? 'c-vessel-form__vessel-type--selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="vesselType"
                    value={option.value}
                    checked={formData.type === option.value}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as VesselType })}
                    className="c-vessel-form__vessel-type-input"
                  />
                  <div className="c-vessel-form__vessel-type-content">
                    <div className="c-vessel-form__vessel-type-icon">
                      <VesselTypeIcon type={option.value} />
                    </div>
                    <div className="c-vessel-form__vessel-type-text">
                      <div className="c-vessel-form__vessel-type-label">{option.label}</div>
                      <div className="c-vessel-form__vessel-type-description">{option.description}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
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
            disabled={isLoading || !formData.name.trim() || formData.capacity < 1 || !formData.type}
            className="c-vessel-form__button c-vessel-form__button--primary"
          >
            {isLoading ? 'Saving...' : isEditing ? 'Update Vessel' : 'Add Vessel'}
          </button>
        </div>
      </form>
    </div>
  );
}