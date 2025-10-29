"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES, SUCCESS_MESSAGES, ERROR_MESSAGES } from "@/utils/constants";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userProfile = await signIn(email, password);

      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('rememberLogin', 'true');
      }

      // Redirect based on user role using the returned profile
      const redirectPath = userProfile?.role === "admin" ? ROUTES.ADMIN :
                          userProfile?.role === "faculty" ? ROUTES.FACULTY :
                          ROUTES.STUDENT;

      router.push(redirectPath);

    } catch (err: any) {
      setError(err.message || ERROR_MESSAGES.GENERIC);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative max-w-lg w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto h-20 w-20 rounded-2xl overflow-hidden bg-white p-2 shadow-xl animate-bounceIn border-2 border-purple-500/20">
            <Image
              src="/Logo.jpg"
              alt="Logo"
              width={80}
              height={80}
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <h2 className="mt-4 text-3xl font-bold gradient-text">
            Welcome Back
          </h2>
          <p className="mt-2 text-lg text-slate-300">
            Sign in to your attendance dashboard
          </p>
          <div className="mt-2 w-16 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto rounded-full"></div>
        </div>

        {/* Login Form */}
        <div className="glass rounded-2xl p-6 shadow-xl border border-white/20 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/20 border border-red-400/40 rounded-xl p-4 backdrop-blur-sm animate-fadeIn">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-red-400 text-xl">⚠️</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-red-200 font-medium text-sm">{error}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setError("")}
                    className="ml-auto text-red-400 hover:text-red-300 text-lg font-bold transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
                  📧 Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                  placeholder="Enter your email address"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pt-7">
                  <span className="text-slate-400">📫</span>
                </div>
              </div>

              <div className="relative">
                <label htmlFor="password" className="block text-sm font-semibold text-white mb-2">
                  🔒 Password
                </label>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 pt-7 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-white/30 rounded bg-white/10 transition-colors"
                />
                <label htmlFor="remember-me" className="ml-2 block text-slate-300 font-medium">
                  💾 Remember me
                </label>
              </div>

              <div>
                <a href="#" className="font-semibold text-purple-400 hover:text-purple-300 transition-colors duration-300">
                  🔐 Forgot password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={!email || !password || loading}
              className={`w-full relative overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${loading ? 'opacity-75 cursor-not-allowed scale-100' : ''}`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span className="text-base">Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span className="text-lg mr-2">🚀</span>
                  <span className="text-base font-semibold">Sign In</span>
                </div>
              )}
              <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity duration-300"></div>
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center border-t border-white/20 pt-6">
            <p className="text-sm text-slate-300">
              Contact admin for account access
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}