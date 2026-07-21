"use client";

import { useState, useEffect } from "react";
import type { User } from "@/lib/types";

function formatMemberSince(dateStr: string) {
  const date = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

export default function UserProfileCard() {
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

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
        <div className="animate-pulse space-y-3">
          <div className="w-14 h-14 bg-gray-800 rounded-full" />
          <div className="h-4 bg-gray-800 rounded w-24" />
          <div className="h-3 bg-gray-800 rounded w-16" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 sticky top-20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-violet-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {(user.displayName || user.username).charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-gray-100 truncate">
            {user.displayName || user.username}
          </p>
          <p className="text-xs text-gray-500 truncate">@{user.username}</p>
        </div>
      </div>

      {user.bio && (
        <p className="text-sm text-gray-400 mb-4 leading-relaxed">{user.bio}</p>
      )}

      <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>Joined {formatMemberSince(user.createdAt)}</span>
      </div>

      <div className="flex gap-4 pt-4 border-t border-gray-800">
        <div>
          <p className="text-sm font-bold text-gray-100">--</p>
          <p className="text-xs text-gray-500">Followers</p>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-100">--</p>
          <p className="text-xs text-gray-500">Following</p>
        </div>
      </div>
    </div>
  );
}
