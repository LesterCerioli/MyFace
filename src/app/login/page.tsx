"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");
    setResetLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail,
          newPassword: resetNewPassword,
          confirmPassword: resetConfirmPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResetSuccess("Password updated successfully. You can now sign in.");
        setResetEmail("");
        setResetNewPassword("");
        setResetConfirmPassword("");
      } else {
        setResetError(data.error || "Reset failed");
      }
    } catch {
      setResetError("Something went wrong");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-black">
      <div className="w-full max-w-sm bg-zinc-900 rounded-xl shadow-sm border border-zinc-700 p-8">
        {!showReset ? (
          <>
            <h1 className="text-2xl font-bold text-center mb-6 text-white">Sign in to MyFace</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Username
                </label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
            <div className="text-sm text-center mt-4 space-y-2">
              <p className="text-zinc-400">
                Don't have an account?{" "}
                <a href="/register" className="text-blue-400 hover:underline">
                  Register
                </a>
              </p>
              <button
                onClick={() => setShowReset(true)}
                className="text-blue-400 hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-center mb-6 text-white">Reset Password</h1>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  required
                  minLength={6}
                />
              </div>
              {resetError && <p className="text-red-500 text-sm">{resetError}</p>}
              {resetSuccess && <p className="text-green-400 text-sm">{resetSuccess}</p>}
              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {resetLoading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
            <p className="text-sm text-center mt-4">
              <button
                onClick={() => { setShowReset(false); setResetError(""); setResetSuccess(""); }}
                className="text-blue-400 hover:underline"
              >
                Back to Sign In
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
