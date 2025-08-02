import BookingWidget from "~/components/BookingWidget";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">
            VesselFlow
          </h1>
          <p className="text-lg text-gray-600">
            Professional Tour Booking System
          </p>
          
          {/* Navigation Links */}
          <div className="mt-4 flex justify-center space-x-4">
            <Link 
              href="/dashboard"
              className="bg-vessel-600 hover:bg-vessel-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Operator Dashboard
            </Link>
            <span className="text-gray-400">|</span>
            <span className="text-gray-600">Customer Booking (below)</span>
          </div>
        </div>
        
        <div className="mx-auto max-w-2xl">
          <BookingWidget />
        </div>
      </div>
    </main>
  );
}
