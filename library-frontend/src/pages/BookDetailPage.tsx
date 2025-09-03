import { getBookById, borrowBookApi, returnBookApi, getMyHistoryApi } from "@/api";
import { Book, BorrowingRecord, UserRole } from "@/types";
import { useEffect, useState, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/authStore";

const BookDetailPage = () => {
  const [book, setBook] = useState<Book | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [activeBorrowRecord, setActiveBorrowRecord] = useState<BorrowingRecord | null>(null);
  
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // useCallback เพื่อป้องกันการ re-create function ทุกครั้งที่ render
  const fetchData = useCallback(async () => {
    if (!id || !user) return;
    setIsPageLoading(true);
    try {
      // ดึงข้อมูลหนังสือและประวัติการยืมพร้อมกันเพื่อประสิทธิภาพ
      const [bookResponse, historyResponse] = await Promise.all([
        getBookById(id),
        getMyHistoryApi(),
      ]);

      setBook(bookResponse.data);

      // หา record การยืมเล่มนี้ที่ยังไม่คืน
      const currentRecord = historyResponse.data.find(
        (record) => record.book.id === id && record.returnedAt === null
      );
      setActiveBorrowRecord(currentRecord || null);
    } catch (error) {
       console.error(error);
      toast.error("Could not find the requested book.");
      navigate("/");
    } finally {
      setIsPageLoading(false);
    }
  }, [id, user, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Handlers for Actions ---

  const handleBorrow = async () => {
    if (!book) return;
    setIsActionLoading(true);
    try {
      await borrowBookApi(book.id);
      toast.success(`You have successfully borrowed "${book.title}"!`);
      await fetchData(); // โหลดข้อมูลใหม่เพื่ออัปเดตสถานะ
    } catch (error) {
       console.error(error);
      toast.error("Failed to borrow book. It might be unavailable or already borrowed.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!activeBorrowRecord || !book) return;
    setIsActionLoading(true);
    try {
      await returnBookApi(activeBorrowRecord.id);
      toast.success(`You have successfully returned "${book.title}"!`);
      await fetchData(); // โหลดข้อมูลใหม่เพื่ออัปเดตสถานะ
    } catch (error) {
      toast.error("Failed to return book.");
      console.error(error);
    } finally {
      setIsActionLoading(false);
    }
  };

  // --- Loading and Data States ---
  if (isPageLoading) {
    return <p className="text-center">Loading book details...</p>;
  }

  if (!book) {
    return <p className="text-center">Book not found.</p>;
  }
  
  // --- Derived State for UI Logic ---
  const isMember = user?.role === UserRole.MEMBER;
  const canManageBooks = user?.role === UserRole.ADMIN || user?.role === UserRole.LIBRARIAN;
  
  const isAvailable = book.availableQuantity > 0;
  const canBorrow = isAvailable && !activeBorrowRecord;
  const canReturn = !!activeBorrowRecord;

  return (
    <div>
      <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{book.title}</CardTitle>
          <CardDescription>By {book.author} - Published in {book.publicationYear}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <img 
              src={book.coverImageUrl || 'https://placehold.co/400x600/64748b/ffffff?text=No+Cover'} 
              alt={`Cover of ${book.title}`}
              className="w-full rounded-lg object-cover shadow-lg"
            />
          </div>
          <div className="md:col-span-2 space-y-4">
            <div>
              <h3 className="font-semibold">Details</h3>
              <Separator className="my-2" />
              <p><strong>ISBN:</strong> {book.isbn}</p>
            </div>
            <div>
              <h3 className="font-semibold">Availability</h3>
              <Separator className="my-2" />
              <p className={`text-lg font-bold ${book.availableQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {book.availableQuantity > 0 ? "Available" : "Not Available"}
              </p>
              <p className="text-muted-foreground">
                {book.availableQuantity} of {book.totalQuantity} copies available.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              {/* REFACTORED: Member-only actions */}
              {isMember && (
                <>
                  <Button onClick={handleBorrow} disabled={!canBorrow || isActionLoading} className="flex-1">
                    {isActionLoading ? "Processing..." : "Borrow Book"}
                  </Button>
                  <Button onClick={handleReturn} disabled={!canReturn || isActionLoading} variant="secondary" className="flex-1">
                     {isActionLoading ? "Processing..." : "Return Book"}
                  </Button>
                </>
              )}
              
              {/* REFACTORED: Admin/Librarian-only actions */}
              {canManageBooks && (
                <Button variant="outline" className="flex-1" asChild>
                  <Link to={`/books/edit/${book.id}`}>
                    <Edit className="mr-2 h-4 w-4" /> Edit Book Details
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookDetailPage;

