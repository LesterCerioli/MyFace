"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import type { User } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          router.push("/login");
          return;
        }
        setUser(data.data);
        setDisplayName(data.data.displayName || "");
        setBio(data.data.bio || "");
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          bio: bio.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setUser((prev) => prev ? { ...prev, displayName: displayName.trim(), bio: bio.trim() } : null);
      } else {
        setError(data.error || "Failed to save");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-gray-900 rounded-2xl border border-gray-800">
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-violet-500 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                {(user?.displayName || user?.username || "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-100">Profile Settings</h1>
                <p className="text-sm text-gray-500">@{user?.username}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Display Name
              </label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="Your display name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                placeholder="Tell us about yourself"
              />
              <p className="text-xs text-gray-600 mt-1.5">{bio.length} characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Email
              </label>
              <input
                value={user?.email || ""}
                disabled
                className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-700 rounded-xl text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-600 mt-1.5">Email cannot be changed</p>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {saved && (
              <div className="bg-green-900/30 border border-green-800 rounded-xl px-4 py-3">
                <p className="text-sm text-green-400">Profile saved successfully!</p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <a
                href="/"
                className="px-6 py-2.5 text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors"
              >
                Cancel
              </a>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
