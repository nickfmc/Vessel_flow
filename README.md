# VesselFlow - Tour Booking Management System

A robust, multi-tenant SaaS application for marine tour operators built with the T3 Stack (Next.js, TypeScript, Prisma, Tailwind CSS).

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Git

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd vessel_flow
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and update the `DATABASE_URL` with your PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/vesselflow"
   NEXTAUTH_SECRET="your-super-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. **Set up the database:**
   ```bash
   # Push schema to database
   npm run db:push
   
   # Seed with demo data
   npm run db:seed
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🎯 Core User Story Implementation

**Problem**: A tour operator has a boat with 6 seats. They schedule a 9:00 AM whale watching tour. A customer books 4 seats. The system must show only 2 seats available for that specific tour without affecting other tours.

**Solution**: Our `ScheduledTour` model links Tours, Vessels, and specific times. The booking system uses Prisma transactions to calculate real-time availability and prevent overbooking.

## 🔑 Key Features Implemented

### ✅ Robust Vessel Management System
- Real-time seat inventory tracking
- Prevents overbooking with database transactions
- Multi-vessel support per operator

### ✅ Core Booking Flow
- Customer booking interface with validation
- Server-side API with comprehensive error handling
- Immediate inventory updates

### ✅ Production-Ready Architecture
- Type-safe with TypeScript
- Server and Client Components
- Environment validation with Zod
- Professional error handling

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **Future Auth**: NextAuth.js
- **Future Payments**: Stripe

## 📋 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push schema changes to database
- `npm run db:seed` - Seed database with demo data
- `npm run db:studio` - Open Prisma Studio

## 🧪 Demo Data

After running `npm run db:seed`, you'll have:

- **Campbell River Charters** (demo operator)
- **2 vessels**: "The Blue Fin" (6 seats), "Sea Explorer" (12 seats)  
- **3 tour types**: Whale Watching, Fishing Charter, Sunset Cruise
- **Scheduled tours** for the next 7 days
- **Sample booking** demonstrating inventory management

---

**Next Steps**: Set up PostgreSQL database and run the seed script to see the complete booking system in action!
