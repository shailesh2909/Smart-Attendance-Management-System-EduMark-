"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/models/User";
import { ROUTES } from "@/utils/constants";
import Navbar from "@/components/navbar/Navbar";
import Sidebar from "@/components/sidebar/Sidebar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface AuthLayoutProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiresApproval?: boolean;
}

export default function AuthLayout({ 
  children, 
  requiredRole, 
  requiresApproval = true 
}: AuthLayoutProps) {
  const { userProfile, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push(ROUTES.LOGIN);
        return;
      }

      // Admins don't need approval, others do if requiresApproval is true
      const needsApproval = requiresApproval && userProfile?.role !== 'admin';
      if (needsApproval && !userProfile?.approved) {
        router.push(ROUTES.WAITING_APPROVAL);
        return;
      }

      if (requiredRole && userProfile?.role !== requiredRole) {
        // Redirect to appropriate dashboard based on user role
        const redirectPath = userProfile?.role === "admin" ? ROUTES.ADMIN :
                            userProfile?.role === "faculty" ? ROUTES.FACULTY :
                            ROUTES.STUDENT;
        router.push(redirectPath);
        return;
      }
    }
  }, [loading, isAuthenticated, userProfile, requiredRole, requiresApproval, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (requiresApproval && !userProfile?.approved) || (requiredRole && userProfile?.role !== requiredRole)) {
    return null; // Will redirect automatically
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}