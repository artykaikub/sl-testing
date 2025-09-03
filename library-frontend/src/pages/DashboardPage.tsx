import { getMostBorrowedBooks, getAllHistoryApi } from "@/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { MostBorrowedBook, BorrowingRecord } from "@/types";
import { Link } from "react-router-dom";

const DashboardPage = () => {
  const [mostBorrowed, setMostBorrowed] = useState<MostBorrowedBook[]>([]);
  const [history, setHistory] = useState<BorrowingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [mostBorrowedRes, historyRes] = await Promise.all([
          getMostBorrowedBooks(),
          getAllHistoryApi(),
        ]);
        setMostBorrowed(mostBorrowedRes.data);
        setHistory(historyRes.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
        toast.error("Failed to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <p className="text-center">Loading dashboard...</p>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Librarian Dashboard</h1>

      <Card>
        <CardHeader>
          <CardTitle>Most Borrowed Books</CardTitle>
          <CardDescription>
            Top 10 most frequently borrowed books in the library.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Rank</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead className="text-right">Total Borrows</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mostBorrowed.map((book, index) => (
                <TableRow key={book.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    <Link to={`/books/${book.id}`} className="hover:underline">
                      {book.title}
                    </Link>
                  </TableCell>
                  <TableCell>{book.author}</TableCell>
                  <TableCell className="text-right">
                    {book.borrowCount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Full Borrowing History</CardTitle>
          <CardDescription>
            A complete log of all borrowing activities, newest first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book Title</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Borrowed At</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    <Link
                      to={`/books/${record.book.id}`}
                      className="hover:underline"
                    >
                      {record.book.title}
                    </Link>
                  </TableCell>
                  <TableCell>{record.user.username}</TableCell>
                  <TableCell>
                    {new Date(record.borrowedAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {record.returnedAt ? (
                      <Badge variant="outline">Returned</Badge>
                    ) : (
                      <Badge variant="secondary">Borrowed</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
