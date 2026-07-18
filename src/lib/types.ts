export interface User {
  userId: string;
  username: string;
  email: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Post {
  postId: string;
  userId: string;
  username: string;
  text: string;
  mediaUrls: string[];
  mediaTypes: string[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
  likedByMe?: boolean;
}

export interface Comment {
  commentId: string;
  postId: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
}

export interface Like {
  postId: string;
  userId: string;
  username: string;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
