import { db } from "~/server/db";
import ScheduleClientPage from "./ScheduleClientPage";

async function getScheduleData() {
  try {
    // Get all scheduled tours for the next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const scheduledTours = await db.scheduledTour.findMany({
      where: {
        startTime: {
          gte: new Date(),
          lte: thirtyDaysFromNow,
        },
      },
      include: {
        tour: true,
        vessel: true,
        bookings: {
          select: {
            passengerCount: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Get all tours and vessels for the form
    const tours = await db.tour.findMany({
      orderBy: {
        title: 'asc',
      },
    });

    const vessels = await db.vessel.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    // Convert Prisma types to plain JavaScript types
    const serializedScheduledTours = scheduledTours.map(scheduledTour => {
      const totalBookedSeats = scheduledTour.bookings.reduce(
        (sum, booking) => sum + booking.passengerCount,
        0
      );

      return {
        id: scheduledTour.id,
        tourId: scheduledTour.tourId,
        vesselId: scheduledTour.vesselId,
        startTime: scheduledTour.startTime.toISOString(),
        createdAt: scheduledTour.createdAt.toISOString(),
        updatedAt: scheduledTour.updatedAt.toISOString(),
        tour: {
          id: scheduledTour.tour.id,
          title: scheduledTour.tour.title,
          description: scheduledTour.tour.description,
          price: scheduledTour.tour.price.toNumber(),
          durationInMinutes: scheduledTour.tour.durationInMinutes,
        },
        vessel: {
          id: scheduledTour.vessel.id,
          name: scheduledTour.vessel.name,
          capacity: scheduledTour.vessel.capacity,
        },
        availability: {
          totalCapacity: scheduledTour.vessel.capacity,
          bookedSeats: totalBookedSeats,
          availableSeats: scheduledTour.vessel.capacity - totalBookedSeats,
          isFullyBooked: totalBookedSeats >= scheduledTour.vessel.capacity,
        },
      };
    });

    const serializedTours = tours.map(tour => ({
      id: tour.id,
      title: tour.title,
      price: tour.price.toNumber(),
      durationInMinutes: tour.durationInMinutes,
    }));

    return {
      scheduledTours: serializedScheduledTours,
      tours: serializedTours,
      vessels,
    };
  } catch (error) {
    console.error("Error fetching schedule data:", error);
    return {
      scheduledTours: [],
      tours: [],
      vessels: [],
    };
  }
}

export default async function SchedulePage() {
  const data = await getScheduleData();
  return <ScheduleClientPage {...data} />;
}