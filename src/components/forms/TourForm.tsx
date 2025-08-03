'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface TourFormProps {
  tour?: {
    id: string;
    title: string;
    description: string | null;
    price: number;
    durationInMinutes: number;
  };
  onClose?: () => void;
}

export function TourForm({ tour, onClose }: TourFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: tour?.title || '',
    description: tour?.description || '',
    price: tour?.price || 89.99,
    durationInMinutes: tour?.durationInMinutes || 180,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!tour;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const url = isEditing ? `/api/tours/${tour.id}` : '/api/tours';
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
        throw new Error(data.message || 'Failed to save tour');
      }

      router.refresh();
      if (onClose) {
        onClose();
      } else {
        router.push('/dashboard/tours');
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

  return (
    <div className="c-tour-form">
      <form onSubmit={handleSubmit} className="c-tour-form__form">
        <div className="c-tour-form__header">
          <h2 className="c-tour-form__title">
            {isEditing ? 'Edit Tour' : 'Create New Tour'}
          </h2>
          <p className="c-tour-form__subtitle">
            {isEditing ? 'Update tour information' : 'Design a new tour experience for your customers'}
          </p>
        </div>

        <div className="c-tour-form__fields">
          {/* Tour Title */}
          <div className="c-tour-form__field">
            <label htmlFor="title" className="c-tour-form__label">
              Tour Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="c-tour-form__input"
              placeholder="e.g., 3-Hour Whale Watching Adventure"
              required
            />
          </div>

          {/* Description */}
          <div className="c-tour-form__field">
            <label htmlFor="description" className="c-tour-form__label">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="c-tour-form__textarea"
              placeholder="Describe what makes this tour special..."
            />
          </div>

          {/* Price and Duration Row */}
          <div className="c-tour-form__row">
            <div className="c-tour-form__field">
              <label htmlFor="price" className="c-tour-form__label">
                Price per Person *
              </label>
              <div className="c-tour-form__input-group">
                <span className="c-tour-form__input-prefix">$</span>
                <input
                  type="number"
                  id="price"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="c-tour-form__input c-tour-form__input--with-prefix"
                  placeholder="89.99"
                  required
                />
              </div>
            </div>

            <div className="c-tour-form__field">
              <label htmlFor="duration" className="c-tour-form__label">
                Duration *
              </label>
              <select
                id="duration"
                value={formData.durationInMinutes}
                onChange={(e) => setFormData({ ...formData, durationInMinutes: parseInt(e.target.value) })}
                className="c-tour-form__select"
                required
              >
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={150}>2.5 hours</option>
                <option value={180}>3 hours</option>
                <option value={240}>4 hours</option>
                <option value={300}>5 hours</option>
                <option value={360}>6 hours</option>
                <option value={480}>8 hours</option>
              </select>
              <p className="c-tour-form__help-text">
                Selected: {formatDuration(formData.durationInMinutes)}
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="c-tour-form__error">
            <p>{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="c-tour-form__actions">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="c-tour-form__button c-tour-form__button--secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || !formData.title.trim() || formData.price <= 0}
            className="c-tour-form__button c-tour-form__button--primary"
          >
            {isLoading ? 'Saving...' : isEditing ? 'Update Tour' : 'Create Tour'}
          </button>
        </div>
      </form>
    </div>
  );
}