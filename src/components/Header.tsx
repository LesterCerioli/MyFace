"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUser(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
  }

  return (
    <header className="bg-orange-600 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="/" className="text-2xl font-bold text-white">
          MyFace
        </a>
        <nav className="flex items-center gap-4">
          {loading ? null : user ? (
            <>
              <a
                href="/"
                className="text-sm font-medium text-white/90 hover:text-white"
              >
                Feed
              </a>
              <a
                href="/settings"
                className="text-sm font-medium text-white/90 hover:text-white"
              >
                Settings
              </a>
              <span className="text-sm text-white/75">
                {user.displayName || user.username}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-white/75 hover:text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <a
                href="/login"
                className="text-sm font-medium text-white/90 hover:text-white"
              >
                Login
              </a>
              <a
                href="/register"
                className="text-sm font-medium bg-white text-orange-600 px-4 py-2 rounded-lg hover:bg-orange-50"
              >
                Register
              </a>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
