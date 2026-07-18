"use client";

import { useState, useEffect } from "react";
import type { Comment } from "@/lib/types";

interface CommentSectionProps {
  postId: string;
  onCommentAdded: (comment: Comment) => void;
}

export default function CommentSection({
  postId,
  onCommentAdded,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/posts/${postId}/comments`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setComments(data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [postId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setComments((prev) => [data.data, ...prev]);
        onCommentAdded(data.data);
        setText("");
      }
    } catch (error) {
      console.error("Comment error:", error);
    } finally {
      setSubmitting(false);
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
    return date.toLocaleDateString();
  }

  return (
    <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 rounded-b-xl">
      <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
        />
        <button
          type="submit"
          disabled={!text.trim() || submitting}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "..." : "Post"}
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-gray-400">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-400">No comments yet.</p>
      ) : (
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.commentId} className="flex gap-2">
              <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0">
                {comment.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm">
                  <span className="font-semibold">{comment.username}</span>{" "}
                  <span className="text-gray-700">{comment.text}</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDate(comment.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
