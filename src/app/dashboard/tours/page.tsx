import { db } from "~/server/db";
import ToursClientPage from "./ToursClientPage";

async function getTours() {
  try {
    // Get the current operator (in a real app, this would come from user session)
    const operator = await db.operator.findFirst();
    
    if (!operator) {
      console.error("No operator found");
      return [];
    }

    const tours = await db.tour.findMany({
      where: {
        operatorId: operator.id, // Filter by current operator
      },
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