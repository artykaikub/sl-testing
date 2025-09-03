import { Book } from '../../books/entities/book.entity';
import { User } from '../../users/entities/user.entity';
import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity()
export class BorrowingRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  borrowedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  returnedAt: Date | null;

  @ManyToOne(() => User, (user) => user.borrowingRecords, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  user: User;

  @ManyToOne(() => Book, (book) => book.borrowingRecords, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  book: Book;
}
