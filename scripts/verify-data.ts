#!/usr/bin/env tsx
/**
 * Script to verify database contents for CRWW operator
 * Usage: npx tsx scripts/verify-data.ts
 */

import { db } from "../src/server/db.js";

async function verifyData() {
  console.log("🔍 Verifying CRWW database contents...\n");

  try {
    // Get the operator
    const operator = await db.operator.findFirst({
      include: {
        vessels: {
          orderBy: { createdAt: 'desc' }
        },
        tours: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!operator) {
      console.log("❌ No operator found in database");
      return;
    }

    console.log(`✅ Operator: ${operator.name} (${operator.email})`);
    console.log(`   ID: ${operator.id}`);
    console.log(`   Created: ${operator.createdAt.toLocaleDateString()}\n`);

    console.log(`🚢 Vessels (${operator.vessels.length}):`);
    if (operator.vessels.length === 0) {
      console.log("   No vessels found");
    } else {
      operator.vessels.forEach((vessel, index) => {
        console.log(`   ${index + 1}. ${vessel.name}`);
        console.log(`      Type: ${vessel.type}`);
        console.log(`      Capacity: ${vessel.capacity} passengers`);
        console.log(`      Created: ${vessel.createdAt.toLocaleDateString()}`);
      });
    }

    console.log(`\n🎯 Tours (${operator.tours.length}):`);
    if (operator.tours.length === 0) {
      console.log("   No tours found");
    } else {
      operator.tours.forEach((tour, index) => {
        console.log(`   ${index + 1}. ${tour.title}`);
        console.log(`      Price: $${tour.price.toNumber()}`);
        console.log(`      Duration: ${tour.durationInMinutes} minutes`);
        console.log(`      Created: ${tour.createdAt.toLocaleDateString()}`);
      });
    }

    // Check for scheduled tours
    const scheduledTours = await db.scheduledTour.findMany({
      where: {
        tour: {
          operatorId: operator.id
        }
      },
      include: {
        tour: { select: { title: true } },
        vessel: { select: { name: true } }
      }
    });

    console.log(`\n📅 Scheduled Tours (${scheduledTours.length}):`);
    if (scheduledTours.length === 0) {
      console.log("   No scheduled tours found");
    } else {
      scheduledTours.forEach((scheduled, index) => {
        console.log(`   ${index + 1}. ${scheduled.tour.title}`);
        console.log(`      Vessel: ${scheduled.vessel.name}`);
        console.log(`      Start Time: ${scheduled.startTime.toLocaleString()}`);
      });
    }

    console.log(`\n📊 Summary:`);
    console.log(`   • ${operator.vessels.length} vessels in fleet`);
    console.log(`   • ${operator.tours.length} tour types available`);
    console.log(`   • ${scheduledTours.length} scheduled tours`);

  } catch (error) {
    console.error("❌ Error verifying data:", error);
  } finally {
    await db.$disconnect();
  }
}

// Run the script
verifyData();
