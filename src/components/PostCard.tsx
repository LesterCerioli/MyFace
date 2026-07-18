"use client";

import { useState } from "react";
import type { Post, Comment } from "@/lib/types";
import CommentSection from "./CommentSection";

interface PostCardProps {
  post: Post;
  onLikeToggled: (postId: string, liked: boolean) => void;
  onCommentAdded: (postId: string, comment: Comment) => void;
}

export default function PostCard({
  post,
  onLikeToggled,
  onCommentAdded,
}: PostCardProps) {
  const [liked, setLiked] = useState(post.likedByMe || false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showComments, setShowComments] = useState(false);
  const [togglingLike, setTogglingLike] = useState(false);

  async function handleLike() {
    if (togglingLike) return;
    setTogglingLike(true);
    try {
      const res = await fetch(`/api/posts/${post.postId}/like`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setLiked(data.data.liked);
        setLikeCount((c) => c + (data.data.liked ? 1 : -1));
        onLikeToggled(post.postId, data.data.liked);
      }
    } catch (error) {
      console.error("Like error:", error);
    } finally {
      setTogglingLike(false);
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
            {post.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-sm">{post.username}</p>
            <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
          </div>
        </div>

        {post.text && (
          <p className="text-gray-800 mb-3 whitespace-pre-wrap">{post.text}</p>
        )}

        {post.mediaUrls.length > 0 && (
          <div
            className={`rounded-xl overflow-hidden mb-3 grid gap-1 ${
              post.mediaUrls.length === 1
                ? "grid-cols-1"
                : post.mediaUrls.length === 2
                ? "grid-cols-2"
                : "grid-cols-2"
            }`}
          >
            {post.mediaUrls.map((url, i) =>
              post.mediaTypes[i] === "video" ? (
                <video
                  key={i}
                  src={url}
                  controls
                  className="w-full aspect-video object-cover"
                />
              ) : (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="w-full aspect-video object-cover"
                  loading="lazy"
                />
              )
            )}
          </div>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-1">
          <span>{likeCount} likes</span>
          <button
            onClick={() => setShowComments(!showComments)}
            className="hover:text-blue-600"
          >
            {post.commentCount} comments
          </button>
        </div>

        <div className="border-t border-gray-100 pt-2 flex gap-4">
          <button
            onClick={handleLike}
            disabled={togglingLike}
            className={`flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              liked
                ? "text-blue-600 bg-blue-50"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {liked ? "Liked" : "Like"}
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            Comment
          </button>
        </div>
      </div>

      {showComments && (
        <CommentSection
          postId={post.postId}
          onCommentAdded={(comment) => onCommentAdded(post.postId, comment)}
        />
      )}
    </div>
  );
}
