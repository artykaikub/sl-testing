import { getBooks, getMyHistoryApi } from "@/api";
import { Book } from "@/types";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const BookListPage = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [borrowedBookIds, setBorrowedBookIds] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [booksResponse, historyResponse] = await Promise.all([
          getBooks(searchTerm),
          getMyHistoryApi(),
        ]);

        setBooks(booksResponse.data);

        const activeBorrows = historyResponse.data
          .filter((record) => record.returnedAt === null)
          .map((record) => record.book.id);
        setBorrowedBookIds(new Set(activeBorrows));
      } catch (error) {
        console.error("Failed to fetch initial data", error);
      } finally {
        setIsLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchInitialData();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Books</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button asChild>
            <Link to="/books/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Book
            </Link>
          </Button>
        </div>
      </div>
      {isLoading ? (
        <p>Loading books...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {books.map((book) => (
            <Card key={book.id} className="flex flex-col">
              <CardHeader>
                <img
                  src={
                    book.coverImageUrl ||
                    "https://placehold.co/400x600/64748b/ffffff?text=No+Cover"
                  }
                  alt={book.title}
                  className="w-full h-48 object-cover mb-4 rounded-md"
                />
                <CardTitle>{book.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{book.author}</p>
                  <p className="text-sm">Published: {book.publicationYear}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p
                      className={`text-sm font-semibold ${
                        book.availableQuantity > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      Available: {book.availableQuantity} / {book.totalQuantity}
                    </p>
                    {borrowedBookIds.has(book.id) && <Badge>Borrowed</Badge>}
                  </div>
                </div>
                <Button className="mt-4 w-full" variant="outline" asChild>
                  <Link to={`/books/${book.id}`}>View Details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookListPage;
