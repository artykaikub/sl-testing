/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createBook, getBookById, updateBook } from "@/api";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import axios from "axios";

// Helper component for loading state, providing a better UX
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

const BookFormSkeleton = () => (
  <Card className="mx-auto max-w-2xl">
    <CardHeader>
      <Skeleton className="h-8 w-1/2 rounded-lg" />
      <Skeleton className="mt-2 h-4 w-3/4 rounded-lg" />
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <div className="space-y-2 pt-4">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-48 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
    </CardContent>
  </Card>
);

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }),
  author: z.string().min(1, { message: "Author is required." }),
  isbn: z.string().min(1, { message: "ISBN is required." }),
  publicationYear: z.number().int().min(1000, "Invalid year.").max(new Date().getFullYear() + 1, "Year cannot be too far in the future."),
  totalQuantity: z.coerce.number().int().min(1, "Quantity must be at least 1."),
  coverImage: z.instanceof(FileList).optional(),
});

type BookFormInput = z.input<typeof formSchema>;   
type BookFormData  = z.output<typeof formSchema>;  

const BookFormPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const form = useForm<BookFormInput, any, BookFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      author: "",
      isbn: "",
      publicationYear: new Date().getFullYear(),
      totalQuantity: 1,
      coverImage: undefined,
    },
  });
  const { reset } = form;

  // Effect to fetch book data when in edit mode.
  useEffect(() => {
    if (isEditMode && id) {
      const fetchBook = async () => {
        setIsFetching(true);
        try {
          const response = await getBookById(id);
          const bookData = response.data;
          
          // Populate the form with data from the server.
          // FIX: Ensure all fields from the schema are included in the reset object.
          reset({
            title: bookData.title,
            author: bookData.author,
            isbn: bookData.isbn,
            publicationYear: bookData.publicationYear,
            totalQuantity: bookData.totalQuantity,
            coverImage: undefined, // Reset file input
          });

          if (bookData.coverImageUrl) {
            setImagePreview(bookData.coverImageUrl);
          }
        } catch (error) {
          toast.error("Failed to fetch book details.");
          console.error(error);
          navigate("/"); // Navigate away if the book can't be found.
        } finally {
          setIsFetching(false);
        }
      };
      fetchBook();
    }
  }, [id, isEditMode, navigate, reset]);

  // Handler for form submission.
  async function onSubmit(values: BookFormData) {
    setIsLoading(true);
    
    // Convert form values to FormData to support file uploads.
    const formData = new FormData();
    (Object.keys(values) as Array<keyof BookFormData>).forEach((key) => {
        const value = values[key];
        if (key === 'coverImage' && value instanceof FileList && value.length > 0) {
            formData.append(key, value[0]);
        } else if (key !== 'coverImage' && value !== undefined) {
            formData.append(key, String(value));
        }
    });

    try {
      const promise = isEditMode && id 
        ? updateBook(id, formData) 
        : createBook(formData);
      
      await promise;
      
      toast.success(`Book ${isEditMode ? 'updated' : 'created'} successfully!`);
      navigate("/"); // Redirect to the book list on success.
    } catch (error) {
      // FIX: Improved type-safe error handling
      let description = "An unknown error occurred.";
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        const serverMessage = error.response.data.message;
        description = Array.isArray(serverMessage) ? serverMessage.join(", ") : serverMessage;
      }
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} book.`, { description });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  // Handler for image input changes to show a preview.
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  // Render a skeleton loader while fetching data in edit mode.
  if (isFetching) {
    return <BookFormSkeleton />;
  }

  return (
    <>
      <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">{isEditMode ? "Edit Book" : "Add New Book"}</CardTitle>
          <CardDescription>
            {isEditMode ? "Update the details of the book." : "Fill in the details to add a new book."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="author" render={({ field }) => ( <FormItem><FormLabel>Author</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="isbn" render={({ field }) => ( <FormItem><FormLabel>ISBN</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="publicationYear" render={({ field }) => ( <FormItem><FormLabel>Publication Year</FormLabel><FormControl><Input type="number" placeholder="e.g., 2024" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField
                  control={form.control}
                  name="totalQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={typeof field.value === "number" || typeof field.value === "string" ? field.value : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="coverImage"
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Cover Image</FormLabel>
                    {imagePreview && <img src={imagePreview} alt="Cover preview" className="mt-2 h-48 w-auto rounded-md object-cover border" />}
                    <FormControl>
                      <Input 
                        type="file" 
                        accept="image/*"
                        {...rest}
                        onChange={(event) => {
                          handleImageChange(event);
                          onChange(event.target.files);
                        }}
                      />
                    </FormControl>
                    <FormDescription>Upload a cover image for the book.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex items-center justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate("/")}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : (isEditMode ? "Update Book" : "Create Book")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
};

export default BookFormPage;

