import { db } from "../src/server/db.js";

async function main() {
  console.log("🌱 Seeding database...");

  // Create a demo operator
  const operator = await db.operator.create({
    data: {
      name: "Campbell River Charters",
      email: "info@campbellrivercharters.com",
      phone: "+1 (250) 555-0123",
      address: "123 Harbour Way, Campbell River, BC V9W 2H1",
    },
  });

  console.log("✅ Created operator:", operator.name);

  // Create vessels
  const blueFin = await db.vessel.create({
    data: {
      name: "The Blue Fin",
      capacity: 6,
      operatorId: operator.id,
    },
  });

  const seaExplorer = await db.vessel.create({
    data: {
      name: "Sea Explorer",
      capacity: 12,
      operatorId: operator.id,
    },
  });

  console.log("✅ Created vessels:", blueFin.name, "&", seaExplorer.name);

  // Create tours
  const whaleWatching = await db.tour.create({
    data: {
      title: "3-Hour Whale Watching Adventure",
      description: "Experience the magnificent orcas and humpback whales in their natural habitat. Our expert guides will take you to the best viewing spots around Campbell River.",
      price: 89.99,
      durationInMinutes: 180,
      operatorId: operator.id,
    },
  });

  const fishingCharter = await db.tour.create({
    data: {
      title: "Salmon Fishing Charter",
      description: "Join us for an unforgettable salmon fishing experience. All equipment provided, including rods, reels, and bait. Perfect for beginners and experts alike.",
      price: 150.00,
      durationInMinutes: 240,
      operatorId: operator.id,
    },
  });

  const sunsetCruise = await db.tour.create({
    data: {
      title: "Sunset Wildlife Cruise",
      description: "Relax and enjoy the stunning Campbell River sunset while spotting seals, eagles, and other local wildlife. Light refreshments included.",
      price: 65.00,
      durationInMinutes: 120,
      operatorId: operator.id,
    },
  });

  console.log("✅ Created tours:", whaleWatching.title, ",", fishingCharter.title, "&", sunsetCruise.title);

  // Create scheduled tours for the next few days
  const today = new Date();
  const scheduledTours = [];

  // Create multiple scheduled tours for different dates and times
  for (let day = 0; day < 7; day++) {
    const tourDate = new Date(today);
    tourDate.setDate(today.getDate() + day);

    // Morning whale watching tour (9:00 AM)
    const morningTour = new Date(tourDate);
    morningTour.setHours(9, 0, 0, 0);
    
    const scheduledWhaleTour = await db.scheduledTour.create({
      data: {
        startTime: morningTour,
        tourId: whaleWatching.id,
        vesselId: blueFin.id,
      },
    });
    scheduledTours.push(scheduledWhaleTour);

    // Afternoon fishing charter (1:00 PM)
    const afternoonTour = new Date(tourDate);
    afternoonTour.setHours(13, 0, 0, 0);
    
    const scheduledFishingTour = await db.scheduledTour.create({
      data: {
        startTime: afternoonTour,
        tourId: fishingCharter.id,
        vesselId: seaExplorer.id,
      },
    });
    scheduledTours.push(scheduledFishingTour);

    // Evening sunset cruise (6:00 PM) - only on weekends
    if (tourDate.getDay() === 0 || tourDate.getDay() === 6) {
      const eveningTour = new Date(tourDate);
      eveningTour.setHours(18, 0, 0, 0);
      
      const scheduledSunsetTour = await db.scheduledTour.create({
        data: {
          startTime: eveningTour,
          tourId: sunsetCruise.id,
          vesselId: blueFin.id,
        },
      });
      scheduledTours.push(scheduledSunsetTour);
    }
  }

  console.log(`✅ Created ${scheduledTours.length} scheduled tours`);

  // Create some sample bookings to demonstrate the inventory system
  const todayMorning = scheduledTours.find(tour => {
    const tourDate = new Date(tour.startTime);
    return tourDate.getHours() === 9 && 
           tourDate.toDateString() === today.toDateString();
  });

  if (todayMorning) {
    // Book 4 seats on today's morning whale watching tour
    await db.booking.create({
      data: {
        passengerCount: 4,
        customerName: "Sarah Johnson",
        customerEmail: "sarah.johnson@email.com",
        scheduledTourId: todayMorning.id,
      },
    });

    console.log("✅ Created sample booking: 4 passengers for today's whale watching tour");
    console.log(`   This leaves ${blueFin.capacity - 4} seats available on The Blue Fin`);
  }

  // Create a hardcoded scheduled tour ID for the demo
  const demoTour = await db.scheduledTour.create({
    data: {
      id: "demo-scheduled-tour-id",
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      tourId: whaleWatching.id,
      vesselId: blueFin.id,
    },
  });

  console.log("✅ Created demo tour with ID:", demoTour.id);

  console.log("\n🎉 Database seeding completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`   • 1 Operator: ${operator.name}`);
  console.log(`   • 2 Vessels: ${blueFin.name} (${blueFin.capacity} seats), ${seaExplorer.name} (${seaExplorer.capacity} seats)`);
  console.log(`   • 3 Tour types: Whale Watching, Fishing Charter, Sunset Cruise`);
  console.log(`   • ${scheduledTours.length + 1} Scheduled tours over the next 7 days`);
  console.log(`   • Sample booking demonstrating inventory management`);
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
