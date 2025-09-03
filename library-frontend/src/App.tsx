import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import BookListPage from "./pages/BookListPage";
import { Toaster } from "@/components/ui/sonner";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";
import AuthLayout from "./components/AuthLayout";
import BookFormPage from "./pages/BookFormPage";
import BookDetailPage from "./pages/BookDetailPage";
import NotFoundPage from "./pages/NotFoundPage";
import MyHistoryPage from "./pages/MyHistoryPage";
import DashboardPage from "./pages/DashboardPage"; // REFACTORED: Import the new dashboard page

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<BookListPage />} />
              <Route path="/books/new" element={<BookFormPage />} />
              <Route path="/books/edit/:id" element={<BookFormPage />} />
              <Route path="/books/:id" element={<BookDetailPage />} />
              <Route path="/history" element={<MyHistoryPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />{" "}
              {/* REFACTORED: Add the route for the dashboard */}
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </>
  );
}

export default App;
