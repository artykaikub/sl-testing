import { ApiProperty } from '@nestjs/swagger';

export class MostBorrowedBookDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  id: string;

  @ApiProperty({ example: 'Clean Code' })
  title: string;

  @ApiProperty({ example: 'Robert C. Martin' })
  author: string;

  @ApiProperty({
    example: 42,
    description: 'The total number of times this book has been borrowed.',
  })
  borrowCount: number;
}
