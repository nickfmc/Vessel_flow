#!/usr/bin/env tsx
/**
 * Script to examine current database structure
 * Usage: npx tsx scripts/examine-db-structure.ts
 */

import { db } from "../src/server/db.js";

async function examineDatabase() {
  console.log("🔍 Examining current database structure...\n");

  try {
    // Check what tables exist
    console.log("1. Checking existing tables...");
    const tables = await db.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    console.log("✅ Existing tables:", tables);

    // Check for migration history
    console.log("\n2. Checking migration history...");
    try {
      const migrations = await db.$queryRaw`
        SELECT * FROM _prisma_migrations 
        ORDER BY finished_at DESC 
        LIMIT 10;
      `;
      console.log("✅ Migration history:", migrations);
    } catch (migrationError) {
      console.log("ℹ️  No migration history table found (this is normal for fresh databases)");
    }

    // Check for any existing data in key tables
    if (Array.isArray(tables) && tables.length > 0) {
      console.log("\n3. Checking for existing data...");
      
      for (const table of tables as any[]) {
        if (table.table_name && !table.table_name.startsWith('_')) {
          try {
            const count = await db.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${table.table_name}"`);
            console.log(`   ${table.table_name}: ${(count as any)[0]?.count || 0} records`);
          } catch (error) {
            console.log(`   ${table.table_name}: Could not count records`);
          }
        }
      }
    }

    // Check for any schema conflicts
    console.log("\n4. Checking for potential schema conflicts...");
    
    // Check if operators table exists and its structure
    try {
      const operatorColumns = await db.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'operators' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;
      console.log("✅ Operators table structure:", operatorColumns);
    } catch (error) {
      console.log("ℹ️  Operators table does not exist");
    }

    // Check if vessels table exists and its structure
    try {
      const vesselColumns = await db.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'vessels' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;
      console.log("✅ Vessels table structure:", vesselColumns);
    } catch (error) {
      console.log("ℹ️  Vessels table does not exist");
    }

    // Check for any custom types/enums
    console.log("\n5. Checking for existing enums...");
    const enums = await db.$queryRaw`
      SELECT typname as enum_name, enumlabel as enum_value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typtype = 'e'
      ORDER BY typname, enumsortorder;
    `;
    console.log("✅ Existing enums:", enums);

  } catch (error) {
    console.error("❌ Error examining database:", error);
    
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log("\n💡 This suggests the database is empty, which is good for initial migration");
      }
    }
  } finally {
    await db.$disconnect();
  }
}

// Run the examination
examineDatabase();