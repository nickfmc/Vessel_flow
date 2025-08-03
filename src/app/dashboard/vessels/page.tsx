import { db } from "~/server/db";
import VesselsClientPage from "./VesselsClientPage";

async function getVessels() {
  try {
    const vessels = await db.vessel.findMany({
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

    return vessels;
  } catch (error) {
    console.error("Error fetching vessels:", error);
    return [];
  }
}

export default async function VesselsPage() {
  const vessels = await getVessels();
  return <VesselsClientPage vessels={vessels} />;
}