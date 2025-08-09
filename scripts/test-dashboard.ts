#!/usr/bin/env tsx
/**
 * Script to test dashboard stats function
 * Usage: npx tsx scripts/test-dashboard.ts
 */

import { db } from "../src/server/db.js";

async function testDashboardStats() {
  console.log("🔍 Testing dashboard stats function...\n");

  try {
    // Get the first operator (demo data)
    const operator = await db.operator.findFirst({
      include: {
        vessels: true,
        tours: true,
      },
    });

    if (!operator) {
      console.log("❌ No operator found");
      return null;
    }

    console.log(`✅ Operator found: ${operator.name} (${operator.email})`);
    console.log(`   Vessels: ${operator.vessels.length}`);
    console.log(`   Tours: ${operator.tours.length}`);

    // Get total bookings for this operator
    const totalBookings = await db.booking.count({
      where: {
        scheduledTour: {
          tour: {
            operatorId: operator.id,
          },
        },
      },
    });
    console.log(`   Total bookings: ${totalBookings}`);

    // Get today's scheduled tours
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysScheduledTours = await db.scheduledTour.count({
      where: {
        tour: {
          operatorId: operator.id,
        },
        startTime: {
          gte: today,
          lt: tomorrow,
        },
      },
    });
    console.log(`   Today's scheduled tours: ${todaysScheduledTours}`);

    // Get total passengers today
    const todaysPassengers = await db.booking.aggregate({
      where: {
        scheduledTour: {
          tour: {
            operatorId: operator.id,
          },
          startTime: {
            gte: today,
            lt: tomorrow,
          },
        },
      },
      _sum: {
        passengerCount: true,
      },
    });
    console.log(`   Today's passengers: ${todaysPassengers._sum.passengerCount || 0}`);

    const stats = {
      operator,
      totalVessels: operator.vessels.length,
      totalTours: operator.tours.length,
      totalBookings,
      todaysScheduledTours,
      todaysPassengers: todaysPassengers._sum.passengerCount || 0,
    };

    console.log("\n✅ Dashboard stats successfully calculated!");
    console.log("📊 Stats summary:");
    console.log(`   • Operator: ${stats.operator.name}`);
    console.log(`   • Total vessels: ${stats.totalVessels}`);
    console.log(`   • Total tours: ${stats.totalTours}`);
    console.log(`   • Total bookings: ${stats.totalBookings}`);
    console.log(`   • Today's tours: ${stats.todaysScheduledTours}`);
    console.log(`   • Today's passengers: ${stats.todaysPassengers}`);

    return stats;

  } catch (error) {
    console.error("❌ Error in dashboard stats:", error);
    return null;
  } finally {
    await db.$disconnect();
  }
}

// Run the script
testDashboardStats();
