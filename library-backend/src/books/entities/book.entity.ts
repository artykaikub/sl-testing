import { BorrowingRecord } from '../../borrowing/entities/borrowing-record.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  isbn: string;

  @Column()
  title: string;

  @Column()
  author: string;

  @Column()
  publicationYear: number;

  @Column({ nullable: true })
  coverImageUrl: string;

  @Column()
  totalQuantity: number;

  @Column()
  availableQuantity: number;

  @OneToMany(() => BorrowingRecord, (record) => record.book)
  borrowingRecords: BorrowingRecord[];
}
