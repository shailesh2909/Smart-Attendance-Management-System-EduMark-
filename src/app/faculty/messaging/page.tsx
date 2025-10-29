"use client";

import FacultyMessaging from '@/components/faculty/FacultyMessaging';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumb from '@/components/ui/Breadcrumb';

export default function FacultyMessagingPage() {
  const { userProfile } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/faculty" className="h-12 w-12 rounded-xl overflow-hidden bg-white p-1 hover:scale-105 transition-transform">
                  <Image
                    src="/Logo.jpg"
                    alt="Logo"
                    width={48}
                    height={48}
                    className="w-full h-full object-contain rounded-lg"
                  />
                </Link>
                <div>
                  <h1 className="text-4xl font-bold gradient-text">Faculty Messaging</h1>
                  <p className="text-slate-300 mt-2 text-lg">
                    Communicate with administration
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: 'Dashboard', href: '/faculty' },
              { label: 'Messaging', href: '/faculty/messaging' }
            ]}
          />
        </div>

        {/* Main Content */}
        <FacultyMessaging />
      </div>
    </div>
  );
}