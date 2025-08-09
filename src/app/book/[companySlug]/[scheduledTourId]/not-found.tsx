import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
            <p className="text-gray-600">
              The tour booking you're looking for doesn't exist or may have been removed.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              This could happen if:
            </p>
            <ul className="text-sm text-gray-500 text-left space-y-1">
              <li>• The booking link is incorrect</li>
              <li>• The tour has been cancelled</li>
              <li>• The company name in the URL is wrong</li>
            </ul>
          </div>

          <div className="mt-6">
            <Link 
              href="/"
              className="bg-vessel-600 hover:bg-vessel-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-block"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}