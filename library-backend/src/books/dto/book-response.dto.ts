import { ApiProperty } from '@nestjs/swagger';
import { Book } from '../entities/book.entity';

export class BookResponseDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    description: 'The unique identifier of the book.',
  })
  id: string;

  @ApiProperty({
    example: '978-0-321-76572-3',
    description: 'The International Standard Book Number.',
  })
  isbn: string;

  @ApiProperty({
    example: 'Clean Code: A Handbook of Agile Software Craftsmanship',
  })
  title: string;

  @ApiProperty({ example: 'Robert C. Martin' })
  author: string;

  @ApiProperty({ example: 2008 })
  publicationYear: number;

  @ApiProperty({
    example: 'https://example.com/covers/clean-code.jpg',
    description: 'URL of the book cover image.',
    nullable: true,
  })
  coverImageUrl: string | null;

  @ApiProperty({
    example: 10,
    description: 'The total number of copies of this book in the library.',
  })
  totalQuantity: number;

  @ApiProperty({
    example: 7,
    description: 'The number of copies currently available for borrowing.',
  })
  availableQuantity: number;

  constructor(book: Book) {
    this.id = book.id;
    this.isbn = book.isbn;
    this.title = book.title;
    this.author = book.author;
    this.publicationYear = book.publicationYear;
    this.coverImageUrl = book.coverImageUrl;
    this.totalQuantity = book.totalQuantity;
    this.availableQuantity = book.availableQuantity;
  }
}
