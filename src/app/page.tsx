"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES, APP_CONFIG } from "@/utils/constants";

export default function HomePage() {
  const { userProfile, loading, isAuthenticated, logout } = useAuth();

  // Don't block rendering while loading - show landing page immediately
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-xl overflow-hidden shadow-lg bg-white p-1">
                <Image
                  src="/Logo.jpg"
                  alt={APP_CONFIG.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">{APP_CONFIG.name}</h1>
                <p className="text-sm text-gray-300">{APP_CONFIG.collegeName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <button 
                  onClick={() => logout()}
                  className="btn-outline"
                >
                  🚪 Logout
                </button>
              ) : (
                <Link href={ROUTES.LOGIN}>
                  <button className="btn-primary">Sign In</button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div>
              <h1 className="text-5xl md:text-7xl font-bold gradient-text mb-6 leading-tight">
                Smart Attendance
                <br />
                <span className="text-white">Management</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Transform your educational institution with our cutting-edge digital attendance system.
                Streamlined, secure, and incredibly intuitive.
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col space-y-6 mb-20">
              <div className="feature-card bg-gradient-to-r from-purple-900/40 to-purple-900/20 backdrop-blur-sm hover:from-purple-900/50 hover:to-purple-900/30 transition-all duration-300 rounded-xl">
                <div className="flex items-center p-8">
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-3xl">⚡</div>
                  <div className="ml-8 flex-1">
                    <h3 className="text-2xl font-semibold text-white mb-2">Lightning Fast</h3>
                    <p className="text-gray-300 text-base">
                      Instant attendance marking with real-time synchronization and immediate notifications across all devices.
                    </p>
                  </div>
                </div>
              </div>

              <div className="feature-card bg-gradient-to-r from-purple-900/40 to-purple-900/20 backdrop-blur-sm hover:from-purple-900/50 hover:to-purple-900/30 transition-all duration-300 rounded-xl">
                <div className="flex items-center p-8">
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-3xl">🔒</div>
                  <div className="ml-8 flex-1">
                    <h3 className="text-2xl font-semibold text-white mb-2">Fort Knox Security</h3>
                    <p className="text-gray-300 text-base">
                      Military-grade encryption with Firebase Auth and secure cloud storage. Your data is completely protected.
                    </p>
                  </div>
                </div>
              </div>

              <div className="feature-card bg-gradient-to-r from-purple-900/40 to-purple-900/20 backdrop-blur-sm hover:from-purple-900/50 hover:to-purple-900/30 transition-all duration-300 rounded-xl">
                <div className="flex items-center p-8">
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-3xl">📊</div>
                  <div className="ml-8 flex-1">
                    <h3 className="text-2xl font-semibold text-white mb-2">Smart Analytics</h3>
                    <p className="text-gray-300 text-base">
                      Comprehensive reports with AI-powered insights to identify attendance patterns and optimize learning.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-slate-800">
        <div className="absolute inset-0 opacity-50" style={{ 
          backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.2) 0%, transparent 60%)'
        }}></div>
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-gray-400 text-lg mb-2">
              Join thousands of educators and students already using our platform
            </p>
          </div>

          <div className="flex flex-col space-y-6">
            {/* Student Card */}
            <div className="role-card bg-gradient-to-r from-purple-900/40 to-purple-900/20 backdrop-blur-sm hover:from-purple-900/50 hover:to-purple-900/30 transition-all duration-300 rounded-xl">
              <div className="flex items-start p-8">
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-purple-400/20 to-purple-600/20 rounded-lg flex items-center justify-center text-3xl">
                  👨‍🎓
                </div>
                <div className="ml-8 flex-1">
                  <h3 className="text-2xl font-semibold text-white mb-3">Students</h3>
                  <p className="text-gray-300 text-base mb-4">
                    Track your attendance, view detailed reports, and stay on top of your academic progress with ease.
                  </p>
                  <div className="flex flex-wrap gap-3 mb-5">
                    <span className="text-base text-gray-400">✓ Real-time attendance tracking</span>
                    <span className="text-base text-gray-400">✓ Performance analytics</span>
                    <span className="text-base text-gray-400">✓ Smart notifications</span>
                  </div>
                  <Link href={ROUTES.LOGIN}>
                    <button className="bg-purple-600/20 hover:bg-purple-600/30 text-white px-6 py-3 rounded-lg text-base transition-all duration-300">
                      Student Login
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Faculty Card */}
            <div className="role-card bg-gradient-to-r from-purple-900/40 to-purple-900/20 backdrop-blur-sm hover:from-purple-900/50 hover:to-purple-900/30 transition-all duration-300 rounded-xl">
              <div className="flex items-start p-8">
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-purple-400/20 to-purple-600/20 rounded-lg flex items-center justify-center text-3xl">
                  👨‍🏫
                </div>
                <div className="ml-8 flex-1">
                  <h3 className="text-2xl font-semibold text-white mb-3">Faculty</h3>
                  <p className="text-gray-300 text-base mb-4">
                    Manage multiple classes, mark attendance instantly, and generate comprehensive reports effortlessly.
                  </p>
                  <div className="flex flex-wrap gap-3 mb-5">
                    <span className="text-base text-gray-400">✓ Quick attendance marking</span>
                    <span className="text-base text-gray-400">✓ Class management</span>
                    <span className="text-base text-gray-400">✓ Automated reports</span>
                  </div>
                  <Link href={ROUTES.LOGIN}>
                    <button className="bg-purple-600/20 hover:bg-purple-600/30 text-white px-6 py-3 rounded-lg text-base transition-all duration-300">
                      Faculty Login
                    </button>
                  </Link>
                </div>
              </div>
            </div>


          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 glass">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="h-10 w-10 rounded-lg overflow-hidden bg-white p-1">
              <Image
                src="/Logo.jpg"
                alt={APP_CONFIG.name}
                width={40}
                height={40}
                className="w-full h-full object-contain rounded-md"
              />
            </div>
            <span className="ml-3 text-xl font-bold gradient-text">{APP_CONFIG.name}</span>
          </div>
          <p className="text-gray-300 mb-2">
            © 2024 {APP_CONFIG.collegeName}. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm">
            Professional Attendance Management System v{APP_CONFIG.version}
          </p>
        </div>
      </footer>
    </div>
  );
}