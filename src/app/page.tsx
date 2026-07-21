"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";
import SearchBar from "@/components/SearchBar";
import UserProfileCard from "@/components/UserProfileCard";
import TrendingTopics from "@/components/TrendingTopics";
import type { Post, Comment } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setAuthenticated(data.success);
        if (!data.success) {
          router.push("/login");
        }
      })
      .catch(() => {
        router.push("/login");
      })
      .finally(() => setCheckingAuth(false));
  }, [router]);

  const loadPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/posts");
      const data = await res.json();
      if (data.success) {
        setPosts(data.data.posts);
      }
    } catch (error) {
      console.error("Load posts error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadPosts();
    }
  }, [authenticated, loadPosts]);

  const filteredPosts = useMemo(() => {
    if (!searchTerm.trim()) return posts;
    const term = searchTerm.toLowerCase();
    return posts.filter(
      (p) =>
        p.text.toLowerCase().includes(term) ||
        p.username.toLowerCase().includes(term)
    );
  }, [posts, searchTerm]);

  function handlePostCreated(post: Post) {
    setPosts((prev) => [post, ...prev]);
  }

  function handleLikeToggled(postId: string, _liked: boolean) {
    setPosts((prev) =>
      prev.map((p) =>
        p.postId === postId
          ? { ...p, likedByMe: _liked, likeCount: p.likeCount + (_liked ? 1 : -1) }
          : p
      )
    );
  }

  function handleCommentAdded(postId: string, _comment: Comment) {
    setPosts((prev) =>
      prev.map((p) =>
        p.postId === postId
          ? { ...p, commentCount: p.commentCount + 1 }
          : p
      )
    );
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!authenticated) return null;

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6 justify-center">
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <UserProfileCard />
          </aside>

          <div className="w-full max-w-xl flex-shrink-0">
            <SearchBar value={searchTerm} onChange={setSearchTerm} />
            <CreatePost onPostCreated={handlePostCreated} />

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-900 rounded-xl border border-gray-800 p-4 animate-pulse">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gray-800 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <div className="h-3 bg-gray-800 rounded w-24" />
                        <div className="h-2 bg-gray-800 rounded w-16" />
                      </div>
                    </div>
                    <div className="h-4 bg-gray-800 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-800 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-900 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-400 mb-1">
                  {searchTerm ? "No posts found" : "No posts yet"}
                </p>
                <p className="text-sm text-gray-600">
                  {searchTerm
                    ? "Try a different search term"
                    : "Create the first post to get started!"}
                </p>
              </div>
            ) : (
              <>
                {searchTerm && (
                  <p className="text-sm text-gray-500 mb-4">
                    Found {filteredPosts.length} {filteredPosts.length === 1 ? "result" : "results"}
                  </p>
                )}
                <div className="space-y-4">
                  {filteredPosts.map((post) => (
                    <PostCard
                      key={post.postId}
                      post={post}
                      onLikeToggled={handleLikeToggled}
                      onCommentAdded={handleCommentAdded}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <aside className="hidden xl:block w-72 flex-shrink-0">
            <TrendingTopics posts={posts} />
          </aside>
        </div>
      </main>
    </div>
  );
}
