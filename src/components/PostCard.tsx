"use client";

import { useState } from "react";
import type { Post, Comment } from "@/lib/types";
import CommentSection from "./CommentSection";

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onLikeToggled: (postId: string, liked: boolean) => void;
  onCommentAdded: (postId: string, comment: Comment) => void;
  onPostUpdated?: (postId: string, text: string) => void;
  onPostDeleted?: (postId: string) => void;
}

export default function PostCard({
  post,
  currentUserId,
  onLikeToggled,
  onCommentAdded,
  onPostUpdated,
  onPostDeleted,
}: PostCardProps) {
  const [liked, setLiked] = useState(post.likedByMe || false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showComments, setShowComments] = useState(false);
  const [togglingLike, setTogglingLike] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.text);
  const [saving, setSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isOwner = currentUserId && post.userId === currentUserId;

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

  async function handleSaveEdit() {
    if (!editText.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/posts/${post.postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editText.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setEditing(false);
        onPostUpdated?.(post.postId, editText.trim());
      }
    } catch (error) {
      console.error("Edit error:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/posts/${post.postId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        onPostDeleted?.(post.postId);
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  }

  function handleCancelEdit() {
    setEditText(post.text);
    setEditing(false);
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
          <div className="flex-1">
            <p className="font-semibold text-sm">{post.username}</p>
            <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
          </div>
          {isOwner && !editing && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <button
                      onClick={() => {
                        setEditText(post.text);
                        setEditing(true);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setConfirmDelete(true);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {editing ? (
          <div className="mb-3">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSaveEdit}
                disabled={saving || !editText.trim()}
                className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          post.text && (
            <p className="text-gray-800 mb-3 whitespace-pre-wrap">{post.text}</p>
          )
        )}

        {post.mediaUrls.length > 0 && (
          <div
            className={`rounded-xl overflow-hidden mb-3 grid gap-1 ${
              post.mediaUrls.length === 1
                ? "grid-cols-1"
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

      {confirmDelete && (
        <div className="border-t border-gray-100 px-4 py-3 bg-red-50 rounded-b-xl">
          <p className="text-sm text-red-700 mb-2">Delete this post?</p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="px-4 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showComments && (
        <CommentSection
          postId={post.postId}
          onCommentAdded={(comment) => onCommentAdded(post.postId, comment)}
        />
      )}
    </div>
  );
}
