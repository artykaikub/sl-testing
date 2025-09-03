import { getMyHistoryApi } from "@/api";
import { BorrowingRecord } from "@/types";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge";

const MyHistoryPage = () => {
    const [history, setHistory] = useState<BorrowingRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            setIsLoading(true);
            try {
                const response = await getMyHistoryApi();
                setHistory(response.data);
            } catch (error) {
                console.error("Failed to fetch borrowing history", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const formatDate = (date: string | Date) => {
        const d = typeof date === "string" ? new Date(date) : date;
        return d.toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>My Borrowing History</CardTitle>
                <CardDescription>A record of all the books you have borrowed.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <p>Loading history...</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Book Title</TableHead>
                                <TableHead>Borrowed On</TableHead>
                                <TableHead>Returned On</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.length > 0 ? history.map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell className="font-medium">{record.book.title}</TableCell>
                                    <TableCell>{formatDate(record.borrowedAt)}</TableCell>
                                    <TableCell>{record.returnedAt ? formatDate(record.returnedAt) : ' - '}</TableCell>
                                    <TableCell>
                                        <Badge variant={record.returnedAt ? "secondary" : "default"}>
                                            {record.returnedAt ? "Returned" : "Borrowed"}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">You haven't borrowed any books yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
};

export default MyHistoryPage;
