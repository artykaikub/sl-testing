import { ApiProperty } from '@nestjs/swagger';
import { BorrowingRecord } from '../entities/borrowing-record.entity';

class BookInRecordDto {
  @ApiProperty({ example: '456a4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'The Lord of the Rings' })
  title: string;
}

class UserInRecordDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'member01' })
  username: string;
}

export class BorrowingRecordResponseDto {
  @ApiProperty({ example: '789b4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty()
  borrowedAt: Date;

  @ApiProperty({ nullable: true, required: false })
  returnedAt: Date | null;

  @ApiProperty({ type: () => UserInRecordDto })
  user: UserInRecordDto;

  @ApiProperty({ type: () => BookInRecordDto })
  book: BookInRecordDto;

  constructor(record: BorrowingRecord) {
    this.id = record.id;
    this.borrowedAt = record.borrowedAt;
    this.returnedAt = record.returnedAt;

    if (record.user) {
      this.user = {
        id: record.user.id,
        username: record.user.username,
      };
    }

    if (record.book) {
      this.book = {
        id: record.book.id,
        title: record.book.title,
      };
    }
  }
}
