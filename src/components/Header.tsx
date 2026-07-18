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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="/" className="text-2xl font-bold text-blue-600">
          MyFace
        </a>
        <nav className="flex items-center gap-4">
          {loading ? null : user ? (
            <>
              <a
                href="/"
                className="text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                Feed
              </a>
              <span className="text-sm text-gray-500">
                {user.displayName || user.username}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-red-500"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <a
                href="/login"
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Login
              </a>
              <a
                href="/register"
                className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
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
