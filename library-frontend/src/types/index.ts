export interface User {
  id: string;
  username: string;
  role: 'admin' | 'librarian' | 'member';
  createdAt: string;
  updatedAt: string;
}

export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publicationYear: number;
  coverImageUrl: string | null;
  totalQuantity: number;
  availableQuantity: number;
}

export interface ValidatedUser {
  id: string;
  username: string;
  role: 'admin' | 'librarian' | 'member';
}

export interface LoginResponse {
  accessToken: string;
}

// REFACTORED: Mirrored the UserRole enum from the backend
// This is the single source of truth for roles on the frontend.
export enum UserRole {
  ADMIN = 'admin',
  LIBRARIAN = 'librarian',
  MEMBER = 'member',
}

export interface BorrowingRecord {
  id: string;
  borrowedAt: Date;
  returnedAt: Date | null;
  user: {
    id: string;
    username: string;
  };
  book: {
    id: string;
    title: string;
  };
}

export interface MostBorrowedBook {
  id: string;
  title: string;
  author: string;
  borrowCount: number;
}
