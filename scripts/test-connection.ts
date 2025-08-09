#!/usr/bin/env tsx
/**
 * Script to test database connection
 * Usage: npx tsx scripts/test-connection.ts
 */

import { PrismaClient } from '@prisma/client';

async function testConnection() {
  console.log("🔍 Testing database connection...\n");

  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    // Test basic connection
    console.log("1. Testing basic connection...");
    await prisma.$connect();
    console.log("✅ Database connection successful");

    // Test query execution
    console.log("\n2. Testing query execution...");
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Query execution successful:", result);

    // Test database info
    console.log("\n3. Getting database info...");
    const dbInfo = await prisma.$queryRaw`SELECT version()`;
    console.log("✅ Database version:", dbInfo);

    console.log("\n🎉 Database connection test passed!");

  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error(error);
    
    if (error instanceof Error) {
      console.error("\nError details:");
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testConnection();