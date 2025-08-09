import { db } from "~/server/db";
import VesselsClientPage from "./VesselsClientPage";

async function getVessels() {
  try {
    // Get the current operator (in a real app, this would come from user session)
    const operator = await db.operator.findFirst();
    
    if (!operator) {
      console.error("No operator found");
      return [];
    }

    const vessels = await db.vessel.findMany({
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

    return vessels;
  } catch (error) {
    console.error("Error fetching vessels:", error);
    return [];
  }
}

export default async function VesselsPage() {
  const vessels = await getVessels();
  
  // Transform the data to match the expected client-side types
  const transformedVessels = vessels.map(vessel => ({
    ...vessel,
    type: vessel.type as 'FISHING_BOAT' | 'ZODIAC' | 'COVERED_VESSEL',
  }));
  
  return <VesselsClientPage vessels={transformedVessels} />;
}