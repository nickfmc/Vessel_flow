'use client';

import { useState } from 'react';

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

interface ScheduleCalendarProps {
  scheduledTours: ScheduledTour[];
  onTourClick?: (tour: ScheduledTour) => void;
}

export function ScheduleCalendar({ scheduledTours, onTourClick }: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get the first day of the current month
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // Get the first day of the calendar (might be from previous month)
  const firstDayOfCalendar = new Date(firstDayOfMonth);
  firstDayOfCalendar.setDate(firstDayOfCalendar.getDate() - firstDayOfMonth.getDay());
  
  // Generate calendar days
  const calendarDays = [];
  const currentCalendarDate = new Date(firstDayOfCalendar);
  
  for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
    calendarDays.push(new Date(currentCalendarDate));
    currentCalendarDate.setDate(currentCalendarDate.getDate() + 1);
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getToursForDate = (date: Date) => {
    const dateString = date.toDateString();
    return scheduledTours.filter(tour => {
      const tourDate = new Date(tour.startTime);
      return tourDate.toDateString() === dateString;
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-CA', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  return (
    <div className="c-schedule-calendar">
      {/* Calendar Header */}
      <div className="c-schedule-calendar__header">
        <button
          onClick={() => navigateMonth('prev')}
          className="c-schedule-calendar__nav-button"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h2 className="c-schedule-calendar__title">
          {currentDate.toLocaleDateString('en-CA', { 
            month: 'long', 
            year: 'numeric' 
          })}
        </h2>
        
        <button
          onClick={() => navigateMonth('next')}
          className="c-schedule-calendar__nav-button"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Days of Week Header */}
      <div className="c-schedule-calendar__days-header">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="c-schedule-calendar__day-header">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="c-schedule-calendar__grid">
        {calendarDays.map((date, index) => {
          const toursForDate = getToursForDate(date);
          const isCurrentMonthDate = isCurrentMonth(date);
          const isTodayDate = isToday(date);
          
          return (
            <div
              key={index}
              className={`c-schedule-calendar__day ${
                !isCurrentMonthDate ? 'c-schedule-calendar__day--other-month' : ''
              } ${
                isTodayDate ? 'c-schedule-calendar__day--today' : ''
              }`}
            >
              <div className="c-schedule-calendar__day-number">
                {date.getDate()}
              </div>
              
              <div className="c-schedule-calendar__day-tours">
                {toursForDate.slice(0, 3).map((tour) => (
                  <div
                    key={tour.id}
                    onClick={() => onTourClick?.(tour)}
                    className={`c-schedule-calendar__tour ${
                      tour.availability.isFullyBooked 
                        ? 'c-schedule-calendar__tour--full' 
                        : 'c-schedule-calendar__tour--available'
                    }`}
                    title={`${tour.tour.title} - ${tour.vessel.name} at ${formatTime(tour.startTime)}`}
                  >
                    <div className="c-schedule-calendar__tour-time">
                      {formatTime(tour.startTime)}
                    </div>
                    <div className="c-schedule-calendar__tour-title">
                      {tour.tour.title.length > 20 
                        ? tour.tour.title.substring(0, 20) + '...' 
                        : tour.tour.title}
                    </div>
                    <div className="c-schedule-calendar__tour-capacity">
                      {tour.availability.availableSeats}/{tour.availability.totalCapacity}
                    </div>
                  </div>
                ))}
                
                {toursForDate.length > 3 && (
                  <div className="c-schedule-calendar__tour-overflow">
                    +{toursForDate.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="c-schedule-calendar__legend">
        <div className="c-schedule-calendar__legend-item">
          <div className="c-schedule-calendar__legend-color c-schedule-calendar__legend-color--available"></div>
          <span>Available</span>
        </div>
        <div className="c-schedule-calendar__legend-item">
          <div className="c-schedule-calendar__legend-color c-schedule-calendar__legend-color--full"></div>
          <span>Fully Booked</span>
        </div>
      </div>
    </div>
  );
}