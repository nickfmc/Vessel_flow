'use client';

import { useState } from 'react';
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

interface BulkScheduleFormProps {
  tours: Tour[];
  vessels: Vessel[];
  onClose?: () => void;
}

interface ScheduleEntry {
  id: string;
  tourId: string;
  vesselId: string;
  startTime: string;
}

export function BulkScheduleForm({ tours, vessels, onClose }: BulkScheduleFormProps) {
  const router = useRouter();
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([
    { id: '1', tourId: '', vesselId: '', startTime: '' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);

  const addScheduleEntry = () => {
    const newEntry: ScheduleEntry = {
      id: Date.now().toString(),
      tourId: '',
      vesselId: '',
      startTime: '',
    };
    setScheduleEntries([...scheduleEntries, newEntry]);
  };

  const removeScheduleEntry = (id: string) => {
    if (scheduleEntries.length > 1) {
      setScheduleEntries(scheduleEntries.filter(entry => entry.id !== id));
    }
  };

  const updateScheduleEntry = (id: string, field: keyof Omit<ScheduleEntry, 'id'>, value: string) => {
    setScheduleEntries(scheduleEntries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const generateWeeklySchedule = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday
    
    const newEntries: ScheduleEntry[] = [];
    
    // Generate schedule for next 7 days
    for (let day = 0; day < 7; day++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + day + 1); // Start from tomorrow
      
      // Morning tour (9:00 AM)
      const morningTime = new Date(date);
      morningTime.setHours(9, 0, 0, 0);
      
      // Afternoon tour (2:00 PM)
      const afternoonTime = new Date(date);
      afternoonTime.setHours(14, 0, 0, 0);
      
      newEntries.push({
        id: `morning-${day}`,
        tourId: tours[0]?.id || '',
        vesselId: vessels[0]?.id || '',
        startTime: morningTime.toISOString().slice(0, 16),
      });
      
      newEntries.push({
        id: `afternoon-${day}`,
        tourId: tours[1]?.id || tours[0]?.id || '',
        vesselId: vessels[1]?.id || vessels[0]?.id || '',
        startTime: afternoonTime.toISOString().slice(0, 16),
      });
    }
    
    setScheduleEntries(newEntries);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessCount(0);

    // Validate all entries
    const validEntries = scheduleEntries.filter(entry => 
      entry.tourId && entry.vesselId && entry.startTime
    );

    if (validEntries.length === 0) {
      setError('Please fill in at least one complete schedule entry');
      setIsLoading(false);
      return;
    }

    let successfulSchedules = 0;
    const errors: string[] = [];

    // Process each entry
    for (const entry of validEntries) {
      try {
        const response = await fetch('/api/scheduled-tours', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tourId: entry.tourId,
            vesselId: entry.vesselId,
            startTime: new Date(entry.startTime).toISOString(),
          }),
        });

        const data = await response.json();

        if (response.ok) {
          successfulSchedules++;
        } else {
          const tour = tours.find(t => t.id === entry.tourId);
          const vessel = vessels.find(v => v.id === entry.vesselId);
          errors.push(`${tour?.title || 'Unknown Tour'} on ${vessel?.name || 'Unknown Vessel'}: ${data.message}`);
        }
      } catch (err) {
        errors.push(`Failed to schedule entry: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    setSuccessCount(successfulSchedules);
    
    if (errors.length > 0) {
      setError(`${successfulSchedules} tours scheduled successfully. Errors: ${errors.join('; ')}`);
    } else if (successfulSchedules > 0) {
      setTimeout(() => {
        router.refresh();
        if (onClose) {
          onClose();
        }
      }, 2000);
    }

    setIsLoading(false);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours === 0) {
      return `${minutes}m`;
    } else if (remainingMinutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${remainingMinutes}m`;
    }
  };

  return (
    <div className="c-bulk-schedule-form">
      <form onSubmit={handleSubmit} className="c-bulk-schedule-form__form">
        <div className="c-bulk-schedule-form__header">
          <h2 className="c-bulk-schedule-form__title">
            Bulk Schedule Tours
          </h2>
          <p className="c-bulk-schedule-form__subtitle">
            Schedule multiple tour departures at once
          </p>
        </div>

        {/* Quick Actions */}
        <div className="c-bulk-schedule-form__quick-actions">
          <button
            type="button"
            onClick={generateWeeklySchedule}
            className="c-bulk-schedule-form__quick-button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Generate Weekly Schedule
          </button>
          <button
            type="button"
            onClick={addScheduleEntry}
            className="c-bulk-schedule-form__quick-button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Entry
          </button>
        </div>

        {/* Schedule Entries */}
        <div className="c-bulk-schedule-form__entries">
          {scheduleEntries.map((entry, index) => (
            <div key={entry.id} className="c-bulk-schedule-form__entry">
              <div className="c-bulk-schedule-form__entry-header">
                <span className="c-bulk-schedule-form__entry-number">
                  #{index + 1}
                </span>
                {scheduleEntries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeScheduleEntry(entry.id)}
                    className="c-bulk-schedule-form__remove-button"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="c-bulk-schedule-form__entry-fields">
                {/* Tour Selection */}
                <div className="c-bulk-schedule-form__field">
                  <label className="c-bulk-schedule-form__label">Tour</label>
                  <select
                    value={entry.tourId}
                    onChange={(e) => updateScheduleEntry(entry.id, 'tourId', e.target.value)}
                    className="c-bulk-schedule-form__select"
                  >
                    <option value="">Select tour...</option>
                    {tours.map((tour) => (
                      <option key={tour.id} value={tour.id}>
                        {tour.title} - ${tour.price} ({formatDuration(tour.durationInMinutes)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vessel Selection */}
                <div className="c-bulk-schedule-form__field">
                  <label className="c-bulk-schedule-form__label">Vessel</label>
                  <select
                    value={entry.vesselId}
                    onChange={(e) => updateScheduleEntry(entry.id, 'vesselId', e.target.value)}
                    className="c-bulk-schedule-form__select"
                  >
                    <option value="">Select vessel...</option>
                    {vessels.map((vessel) => (
                      <option key={vessel.id} value={vessel.id}>
                        {vessel.name} ({vessel.capacity} seats)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start Time */}
                <div className="c-bulk-schedule-form__field">
                  <label className="c-bulk-schedule-form__label">Departure</label>
                  <input
                    type="datetime-local"
                    value={entry.startTime}
                    onChange={(e) => updateScheduleEntry(entry.id, 'startTime', e.target.value)}
                    className="c-bulk-schedule-form__input"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Success Message */}
        {successCount > 0 && (
          <div className="c-bulk-schedule-form__success">
            <p>Successfully scheduled {successCount} tour{successCount > 1 ? 's' : ''}!</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="c-bulk-schedule-form__error">
            <p>{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="c-bulk-schedule-form__actions">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="c-bulk-schedule-form__button c-bulk-schedule-form__button--secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || scheduleEntries.every(entry => !entry.tourId || !entry.vesselId || !entry.startTime)}
            className="c-bulk-schedule-form__button c-bulk-schedule-form__button--primary"
          >
            {isLoading ? 'Scheduling...' : `Schedule ${scheduleEntries.filter(e => e.tourId && e.vesselId && e.startTime).length} Tours`}
          </button>
        </div>
      </form>
    </div>
  );
}