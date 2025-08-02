import BookingWidget from "~/components/BookingWidget";

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
        </div>
        
        <div className="mx-auto max-w-2xl">
          <BookingWidget />
        </div>
      </div>
    </main>
  );
}
