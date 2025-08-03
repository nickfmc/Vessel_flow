'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Tour {
  id: string;
  title: string;
  durationInMinutes: number;
  price: number;
}

interface Vessel {
  id: string;
  name: string;
  capacity: number;
}

interface ScheduledTourFormProps {
  scheduledTour?: {
    id: string;
    tourId: string;
    vesselId: string;
    startTime: string;
  };
  tours: Tour[];
  vessels: Vessel[];
  onClose?: () => void;
}

export function ScheduledTourForm({ scheduledTour, tours, vessels, onClose }: ScheduledTourFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    tourId: scheduledTour?.tourId || '',
    vesselId: scheduledTour?.vesselId || '',
    startTime: scheduledTour?.startTime ? 
      new Date(scheduledTour.startTime).toISOString().slice(0, 16) : 
      '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);

  const isEditing = !!scheduledTour;

  // Update selected tour when tourId changes
  useEffect(() => {
    if (formData.tourId) {
      const tour = tours.find(t => t.id === formData.tourId);
      setSelectedTour(tour || null);
    } else {
      setSelectedTour(null);
    }
  }, [formData.tourId, tours]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const url = isEditing ? `/api/scheduled-tours/${scheduledTour.id}` : '/api/scheduled-tours';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          startTime: new Date(formData.startTime).toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save scheduled tour');
      }

      router.refresh();
      if (onClose) {
        onClose();
      } else {
        router.push('/dashboard/schedule');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours === 0) {
      return `${minutes} minutes`;
    } else if (remainingMinutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${hours}h ${remainingMinutes}m`;
    }
  };

  const getEndTime = () => {
    if (!formData.startTime || !selectedTour) return '';
    
    const startTime = new Date(formData.startTime);
    const endTime = new Date(startTime.getTime() + selectedTour.durationInMinutes * 60000);
    
    return endTime.toLocaleString('en-CA', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="c-scheduled-tour-form">
      <form onSubmit={handleSubmit} className="c-scheduled-tour-form__form">
        <div className="c-scheduled-tour-form__header">
          <h2 className="c-scheduled-tour-form__title">
            {isEditing ? 'Edit Scheduled Tour' : 'Schedule New Tour'}
          </h2>
          <p className="c-scheduled-tour-form__subtitle">
            {isEditing ? 'Update tour schedule details' : 'Create a new tour departure time'}
          </p>
        </div>

        <div className="c-scheduled-tour-form__fields">
          {/* Tour Selection */}
          <div className="c-scheduled-tour-form__field">
            <label htmlFor="tourId" className="c-scheduled-tour-form__label">
              Tour Package *
            </label>
            <select
              id="tourId"
              value={formData.tourId}
              onChange={(e) => setFormData({ ...formData, tourId: e.target.value })}
              className="c-scheduled-tour-form__select"
              required
            >
              <option value="">Select a tour...</option>
              {tours.map((tour) => (
                <option key={tour.id} value={tour.id}>
                  {tour.title} - ${tour.price} ({formatDuration(tour.durationInMinutes)})
                </option>
              ))}
            </select>
          </div>

          {/* Vessel Selection */}
          <div className="c-scheduled-tour-form__field">
            <label htmlFor="vesselId" className="c-scheduled-tour-form__label">
              Vessel *
            </label>
            <select
              id="vesselId"
              value={formData.vesselId}
              onChange={(e) => setFormData({ ...formData, vesselId: e.target.value })}
              className="c-scheduled-tour-form__select"
              required
            >
              <option value="">Select a vessel...</option>
              {vessels.map((vessel) => (
                <option key={vessel.id} value={vessel.id}>
                  {vessel.name} (Capacity: {vessel.capacity} passengers)
                </option>
              ))}
            </select>
          </div>

          {/* Start Time */}
          <div className="c-scheduled-tour-form__field">
            <label htmlFor="startTime" className="c-scheduled-tour-form__label">
              Departure Time *
            </label>
            <input
              type="datetime-local"
              id="startTime"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="c-scheduled-tour-form__input"
              min={new Date().toISOString().slice(0, 16)}
              required
            />
            {selectedTour && formData.startTime && (
              <p className="c-scheduled-tour-form__help-text">
                Tour will end at: {getEndTime()}
              </p>
            )}
          </div>

          {/* Tour Summary */}
          {selectedTour && (
            <div className="c-scheduled-tour-form__summary">
              <h3 className="c-scheduled-tour-form__summary-title">Tour Summary</h3>
              <div className="c-scheduled-tour-form__summary-content">
                <div className="c-scheduled-tour-form__summary-item">
                  <span className="c-scheduled-tour-form__summary-label">Duration:</span>
                  <span className="c-scheduled-tour-form__summary-value">
                    {formatDuration(selectedTour.durationInMinutes)}
                  </span>
                </div>
                <div className="c-scheduled-tour-form__summary-item">
                  <span className="c-scheduled-tour-form__summary-label">Price per person:</span>
                  <span className="c-scheduled-tour-form__summary-value">
                    ${selectedTour.price}
                  </span>
                </div>
                {formData.vesselId && (
                  <div className="c-scheduled-tour-form__summary-item">
                    <span className="c-scheduled-tour-form__summary-label">Max capacity:</span>
                    <span className="c-scheduled-tour-form__summary-value">
                      {vessels.find(v => v.id === formData.vesselId)?.capacity} passengers
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="c-scheduled-tour-form__error">
            <p>{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="c-scheduled-tour-form__actions">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="c-scheduled-tour-form__button c-scheduled-tour-form__button--secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || !formData.tourId || !formData.vesselId || !formData.startTime}
            className="c-scheduled-tour-form__button c-scheduled-tour-form__button--primary"
          >
            {isLoading ? 'Saving...' : isEditing ? 'Update Schedule' : 'Schedule Tour'}
          </button>
        </div>
      </form>
    </div>
  );
}