import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Book } from '../books/entities/book.entity';
import { User } from '../users/entities/user.entity';
import { DataSource, IsNull, Repository } from 'typeorm';
import { BorrowingRecord } from './entities/borrowing-record.entity';
import { isError } from '../utils/type-guards';

@Injectable()
export class BorrowingService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(BorrowingRecord)
    private borrowingRepository: Repository<BorrowingRecord>,
  ) {}

  async borrowBook(bookId: string, userId: string): Promise<BorrowingRecord> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // The pessimistic lock here is crucial to prevent race conditions
      const book = await queryRunner.manager
        .getRepository(Book)
        .createQueryBuilder('book')
        .setLock('pessimistic_write')
        .where('book.id = :id', { id: bookId })
        .getOne();

      if (!book) {
        throw new NotFoundException('Book not found');
      }
      if (book.availableQuantity <= 0) {
        throw new ConflictException('Book is not available for borrowing');
      }

      const existingRecord = await queryRunner.manager.findOneBy(
        BorrowingRecord,
        {
          book: { id: bookId },
          user: { id: userId },
          returnedAt: IsNull(),
        },
      );

      if (existingRecord) {
        throw new ConflictException(
          'You have already borrowed this book and not yet returned it.',
        );
      }

      book.availableQuantity -= 1;
      await queryRunner.manager.save(book);

      const newRecord = this.borrowingRepository.create({
        book,
        user: { id: userId } as User,
      });
      await queryRunner.manager.save(newRecord);

      await queryRunner.commitTransaction();
      return newRecord;
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();

      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An unexpected error occurred while borrowing the book.',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async returnBook(recordId: string, userId: string): Promise<BorrowingRecord> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const record = await queryRunner.manager.findOne(BorrowingRecord, {
        where: { id: recordId, returnedAt: IsNull() },
        relations: { book: true, user: true },
      });

      if (!record) {
        throw new NotFoundException('Active borrowing record not found');
      }
      if (record.user.id !== userId) {
        throw new ForbiddenException(
          'You cannot return a book you did not borrow',
        );
      }

      const book = await queryRunner.manager
        .getRepository(Book)
        .createQueryBuilder('book')
        .setLock('pessimistic_write')
        .where('book.id = :id', { id: record.book.id })
        .getOne();

      if (!book) {
        throw new NotFoundException(
          `The book associated with this record (ID: ${record.book.id}) could not be found.`,
        );
      }

      book.availableQuantity += 1;
      await queryRunner.manager.save(book);

      record.returnedAt = new Date();
      await queryRunner.manager.save(record);

      await queryRunner.commitTransaction();
      return record;
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();

      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      console.error('An unexpected error occurred in returnBook:', error);
      if (isError(error)) {
        throw new InternalServerErrorException(error.message);
      }
      throw new InternalServerErrorException(
        'An unexpected error occurred while returning the book.',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async getMyHistory(userId: string): Promise<BorrowingRecord[]> {
    return this.borrowingRepository.find({
      where: { user: { id: userId } },
      relations: { book: true },
      order: { borrowedAt: 'DESC' },
    });
  }

  async getAllHistory(): Promise<BorrowingRecord[]> {
    return this.borrowingRepository.find({
      relations: { book: true, user: true },
      order: { borrowedAt: 'DESC' },
    });
  }
}
