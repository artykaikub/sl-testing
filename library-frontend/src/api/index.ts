import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { LoginDto } from '@/pages/LoginPage'; // We'll create this DTO type soon
import { Book, BorrowingRecord, LoginResponse, MostBorrowedBook, ValidatedUser } from '@/types';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      // window.location.href = '/login'; // Redirect to login page
    }
    return Promise.reject(error);
  }
);

export const loginUser = (credentials: LoginDto) => 
  api.post<LoginResponse>('/auth/login', credentials);

export const getProfile = () => 
  api.get<ValidatedUser>('/auth/profile');

export const getBooks = (query?: string) => 
  api.get<Book[]>(query ? `/books/search?q=${query}` : '/books');

export const getBookById = (id: string) => 
  api.get<Book>(`/books/${id}`);

export const createBook = (data: FormData) => 
  api.post<Book>('/books', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateBook = (id: string, data: FormData) => 
  api.patch<Book>(`/books/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const borrowBookApi = (bookId: string) =>
  api.post<BorrowingRecord>(`/borrowing/borrow/${bookId}`);

export const returnBookApi = (recordId: string) =>
  api.post<BorrowingRecord>(`/borrowing/return/${recordId}`);
  
export const getMyHistoryApi = () =>
  api.get<BorrowingRecord[]>('/borrowing/history/me');

export const getAllHistoryApi = () => api.get<BorrowingRecord[]>('/borrowing/history/all');

export const getMostBorrowedBooks = () =>
    api.get<MostBorrowedBook[]>('/books/analytics/most-borrowed');


export default api;