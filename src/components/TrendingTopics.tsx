"use client";

import { useMemo } from "react";
import type { Post } from "@/lib/types";

interface TrendingTopicsProps {
  posts: Post[];
}

export default function TrendingTopics({ posts }: TrendingTopicsProps) {
  const trends = useMemo(() => {
    const counts = new Map<string, number>();

    for (const post of posts) {
      const hashtags = post.text.match(/#[\p{L}\w-]+/gu) || [];
      for (const tag of hashtags) {
        const key = tag.toLowerCase();
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [posts]);

  const uniqueAuthors = useMemo(
    () => new Set(posts.map((p) => p.userId)).size,
    [posts]
  );

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 sticky top-20">
      <h2 className="text-sm font-bold text-gray-100 mb-1">What&apos;s Happening</h2>
      <p className="text-xs text-gray-500 mb-5">Latest activity on MyFace</p>

      <div className="flex gap-3 mb-5">
        <div className="flex-1 bg-gray-950 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-gray-100">{posts.length}</p>
          <p className="text-xs text-gray-500">Posts</p>
        </div>
        <div className="flex-1 bg-gray-950 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-gray-100">{uniqueAuthors}</p>
          <p className="text-xs text-gray-500">Users</p>
        </div>
      </div>

      {trends.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7.5 7.5h3.75L9 3 5.25 7.5h3.75zm0 9h3.75L9 12l-3.75 4.5h3.75zM16.5 7.5h3.75L18 3l-2.25 4.5h3.75zm0 9h3.75L18 12l-2.25 4.5h3.75z" />
            </svg>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Trending</span>
          </div>
          <div className="space-y-3">
            {trends.map(([tag, count]) => (
              <div key={tag} className="group cursor-pointer">
                <p className="text-sm font-medium text-blue-400 group-hover:text-blue-300 transition-colors">
                  {tag}
                </p>
                <p className="text-xs text-gray-600">{count} {count === 1 ? "post" : "posts"}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {trends.length === 0 && posts.length > 0 && (
        <p className="text-xs text-gray-500 text-center py-3">
          No trending topics yet. Use #hashtags in your posts!
        </p>
      )}
    </div>
  );
}
