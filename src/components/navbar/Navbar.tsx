"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { APP_CONFIG, ROUTES } from "@/utils/constants";
import Button from "@/components/ui/Button";

export default function Navbar() {
  const { userProfile, logout, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navLinks = isAuthenticated ? [
    {
      href: userProfile?.role === "admin" ? ROUTES.ADMIN : 
            userProfile?.role === "faculty" ? ROUTES.FACULTY : 
            ROUTES.STUDENT,
      label: "Dashboard"
    },
    ...(userProfile?.role === "admin" ? [
      { href: ROUTES.ADMIN_USERS, label: "Users" },
      { href: ROUTES.ADMIN_CLASSES, label: "Classes" },
      { href: ROUTES.ADMIN_REPORTS, label: "Reports" },
    ] : []),
    ...(userProfile?.role === "faculty" ? [
      { href: ROUTES.FACULTY_CLASSES, label: "My Classes" },
      { href: ROUTES.FACULTY_ATTENDANCE, label: "Mark Attendance" },
      { href: ROUTES.FACULTY_REPORTS, label: "Reports" },
    ] : []),
    ...(userProfile?.role === "student" ? [
      { href: ROUTES.STUDENT_ATTENDANCE, label: "My Attendance" },
      { href: ROUTES.STUDENT_PROFILE, label: "Profile" },
    ] : []),
  ] : [];

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href={ROUTES.HOME} className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{APP_CONFIG.name}</h1>
                <p className="text-xs text-gray-600">{APP_CONFIG.collegeName}</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {/* User Info */}
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-gray-900">{userProfile?.name}</p>
                  <p className="text-xs text-gray-600 capitalize">{userProfile?.role}</p>
                </div>

                {/* User Avatar */}
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {userProfile?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Logout Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="hidden md:block"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href={ROUTES.LOGIN}>
                  <Button variant="primary" size="sm">
                    Login
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              
              {isAuthenticated && (
                <div className="pt-4 border-t border-gray-200 mt-4">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-gray-900">{userProfile?.name}</p>
                    <p className="text-xs text-gray-600 capitalize">{userProfile?.role}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}