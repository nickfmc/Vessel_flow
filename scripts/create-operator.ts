#!/usr/bin/env tsx
/**
 * Script to create a new operator account
 * Usage: npx tsx scripts/create-operator.ts
 */

import { db } from "../src/server/db.js";

async function createOperator() {
  console.log("🏢 Creating CRWW operator account...");

  try {
    // Check if operator already exists
    const existingOperator = await db.operator.findFirst({
      where: {
        OR: [
          { email: "admin@crww.com" },
          { name: { contains: "CRWW", mode: "insensitive" } }
        ]
      }
    });

    if (existingOperator) {
      console.log("⚠️  CRWW operator already exists:");
      console.log(`   ID: ${existingOperator.id}`);
      console.log(`   Name: ${existingOperator.name}`);
      console.log(`   Email: ${existingOperator.email}`);
      return existingOperator;
    }

    // Create the CRWW operator
    const operator = await db.operator.create({
      data: {
        name: "CRWW Marine Operations",
        email: "admin@crww.com",
        phone: "+1 (555) 123-4567",
        address: "123 Marina Way, Coastal City, CC 12345",
      },
    });

    console.log("✅ CRWW operator created successfully!");
    console.log(`   ID: ${operator.id}`);
    console.log(`   Name: ${operator.name}`);
    console.log(`   Email: ${operator.email}`);
    console.log(`   Phone: ${operator.phone}`);
    console.log(`   Address: ${operator.address}`);

    // Show system capabilities
    console.log("\n🔧 System Multi-Operator Capabilities:");
    console.log("   ✓ Each operator has isolated vessels, tours, and bookings");
    console.log("   ✓ Operator-specific data filtering in all queries");
    console.log("   ✓ Cascade deletes maintain data integrity");
    console.log("   ✓ Ready for multi-tenant authentication");

    return operator;

  } catch (error) {
    console.error("❌ Error creating operator:", error);
    throw error;
  }
}

async function main() {
  try {
    const operator = await createOperator();
    
    // Optional: Create a sample vessel for the operator
    console.log("\n🚢 Creating sample vessel for CRWW...");
    
    const vessel = await db.vessel.create({
      data: {
        name: "CRWW Explorer",
        type: "COVERED_VESSEL",
        capacity: 12,
        operatorId: operator.id,
      },
    });

    console.log(`✅ Sample vessel created: ${vessel.name} (${vessel.capacity} passengers)`);
    
    console.log("\n🎉 Setup complete! You can now:");
    console.log("   • Access the dashboard at http://localhost:3000/dashboard");
    console.log("   • Add more vessels in the Vessels section");
    console.log("   • Create tours in the Tours section");
    console.log("   • Schedule tours and manage bookings");
    
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Run the script
main();
