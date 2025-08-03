import Link from "next/link";
import { SidebarNav } from "~/components/navigation/SidebarNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-vessel-600">
                VesselFlow
              </Link>
              <span className="ml-2 text-sm text-gray-500">Operator Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Campbell River Charters</span>
              <div className="w-8 h-8 bg-vessel-100 rounded-full flex items-center justify-center">
                <span className="text-vessel-600 font-medium">CR</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="c-sidebar">
          <SidebarNav />
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
