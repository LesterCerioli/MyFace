"use client";

import { useState, useRef } from "react";
import type { Post } from "@/lib/types";

interface CreatePostProps {
  onPostCreated: (post: Post) => void;
}

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const [text, setText] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [mediaTypes, setMediaTypes] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const newFiles: File[] = [];
    const newPreviews: string[] = [];
    const newTypes: string[] = [];

    files.forEach((file) => {
      if (
        ALLOWED_IMAGE_TYPES.includes(file.type) ||
        ALLOWED_VIDEO_TYPES.includes(file.type)
      ) {
        newFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
        newTypes.push(file.type.startsWith("video/") ? "video" : "image");
      }
    });

    setMediaFiles((prev) => [...prev, ...newFiles]);
    setMediaPreviews((prev) => [...prev, ...newPreviews]);
    setMediaTypes((prev) => [...prev, ...newTypes]);
  }

  function removeMedia(index: number) {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
    setMediaTypes((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if ((!text.trim() && mediaFiles.length === 0) || posting) return;

    setPosting(true);
    try {
      const uploadedUrls: string[] = [];
      const uploadedTypes: string[] = [];

      for (let i = 0; i < mediaFiles.length; i++) {
        const file = mediaFiles[i];
        const presignRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, contentType: file.type }),
        });

        const presignData = await presignRes.json();
        if (!presignData.success) throw new Error("Failed to get upload URL");

        await fetch(presignData.data.uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        uploadedUrls.push(presignData.data.publicUrl);
        uploadedTypes.push(presignData.data.mediaType);
      }

      const postRes = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          mediaUrls: uploadedUrls,
          mediaTypes: uploadedTypes,
        }),
      });

      const postData = await postRes.json();
      if (postData.success) {
        onPostCreated(postData.data);
        setText("");
        setMediaFiles([]);
        setMediaPreviews([]);
        setMediaTypes([]);
      }
    } catch (error) {
      console.error("Create post error:", error);
    } finally {
      setPosting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6"
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What's on your mind?"
        className="w-full resize-none border-0 focus:ring-0 text-base placeholder-gray-400 outline-none min-h-[80px]"
        rows={3}
      />

      {mediaPreviews.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {mediaPreviews.map((preview, i) => (
            <div key={i} className="relative">
              {mediaTypes[i] === "video" ? (
                <video
                  src={preview}
                  className="h-20 w-20 object-cover rounded-lg"
                />
              ) : (
                <img
                  src={preview}
                  alt=""
                  className="h-20 w-20 object-cover rounded-lg"
                />
              )}
              <button
                type="button"
                onClick={() => removeMedia(i)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-500 hover:text-blue-600 text-sm flex items-center gap-1"
          >
            Photo / Video
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
        <button
          type="submit"
          disabled={(!text.trim() && mediaFiles.length === 0) || posting}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {posting ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}
