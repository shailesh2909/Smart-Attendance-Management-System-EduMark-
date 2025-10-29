"use client";

import { useAuth } from "@/hooks/useAuth";

export default function FacultyClassesPage() {
  const { userProfile } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0118] p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold gradient-text mb-8">My Classes</h1>
        
        <div className="bg-gray-800/20 border border-purple-500/20 rounded-lg p-8">
          <p className="text-gray-300">Classes management coming soon...</p>
        </div>
      </div>
    </div>
  );
}
