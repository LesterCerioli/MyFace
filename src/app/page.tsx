"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";
import type { Post, Comment } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!authenticated) return null;

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <CreatePost onPostCreated={handlePostCreated} />

        {loading ? (
          <div className="text-center py-12 text-gray-400">
            Loading posts...
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg font-medium mb-1">No posts yet</p>
            <p className="text-sm">
              Create the first post to get started!
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.postId}
              post={post}
              onLikeToggled={handleLikeToggled}
              onCommentAdded={handleCommentAdded}
            />
          ))
        )}
      </main>
    </div>
  );
}
