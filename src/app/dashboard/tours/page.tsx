import { db } from "~/server/db";
import ToursClientPage from "./ToursClientPage";

async function getTours() {
  try {
    const tours = await db.tour.findMany({
      include: {
        operator: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            scheduledTours: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Convert Prisma types to plain JavaScript types for client component
    return tours.map(tour => ({
      ...tour,
      price: tour.price.toNumber(),
      createdAt: tour.createdAt.toISOString(),
      updatedAt: tour.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching tours:", error);
    return [];
  }
}

export default async function ToursPage() {
  const tours = await getTours();
  return <ToursClientPage tours={tours} />;
}