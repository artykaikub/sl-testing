/* eslint-disable @typescript-eslint/no-unsafe-return */
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, ILike, Repository } from 'typeorm';
import { Book } from './entities/book.entity';
import { FilesService } from 'src/files/files.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { isError } from 'src/utils/type-guards';
import { MostBorrowedBookDto } from './dto/most-borrowing-book.dto';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private booksRepository: Repository<Book>,
    private filesService: FilesService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(
    createBookDto: CreateBookDto,
    imageBuffer?: Buffer,
    filename?: string,
  ): Promise<Book> {
    const bookData: Partial<Book> = {
      ...createBookDto,
      availableQuantity: createBookDto.totalQuantity,
    };

    if (imageBuffer && filename) {
      bookData.coverImageUrl = await this.filesService.uploadPublicFile(
        imageBuffer,
        filename,
      );
    }

    const newBook = this.booksRepository.create(bookData);
    return this.booksRepository.save(newBook);
  }

  async findAll(options?: FindManyOptions<Book>): Promise<Book[]> {
    return this.booksRepository.find(options);
  }

  async findOne(id: string): Promise<Book> {
    const book = await this.booksRepository.findOneBy({ id });
    if (!book) {
      throw new NotFoundException(`Book with ID "${id}" not found`);
    }
    return book;
  }

  async searchBooks(query: string): Promise<Book[]> {
    const cacheKey = `search_books_${query.toLowerCase()}`;
    const cachedData = await this.cacheManager.get<Book[]>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const books = await this.booksRepository.find({
      where: [{ title: ILike(`%${query}%`) }, { author: ILike(`%${query}%`) }],
    });

    await this.cacheManager.set(cacheKey, books, 300);
    return books;
  }

  async update(
    id: string,
    updateBookDto: UpdateBookDto,
    imageBuffer?: Buffer,
    filename?: string,
  ): Promise<Book> {
    const book = await this.findOne(id);

    if (imageBuffer && filename) {
      book.coverImageUrl = await this.filesService.uploadPublicFile(
        imageBuffer,
        filename,
      );
    }

    try {
      if (updateBookDto.totalQuantity !== undefined) {
        const borrowedCount = book.totalQuantity - book.availableQuantity;
        if (updateBookDto.totalQuantity < borrowedCount) {
          throw new BadRequestException(
            'Total quantity cannot be less than the number of currently borrowed books.',
          );
        }
        const newAvailableQuantity =
          updateBookDto.totalQuantity - borrowedCount;
        book.availableQuantity = newAvailableQuantity;
      }

      Object.assign(book, updateBookDto);

      return this.booksRepository.save(book);
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (isError(error)) {
        throw new InternalServerErrorException(error.message);
      }
      throw new InternalServerErrorException('Failed to update book details.');
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.booksRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Book with ID "${id}" not found`);
    }
  }

  async getMostBorrowedBooks(): Promise<MostBorrowedBookDto[]> {
    const rawData = await this.booksRepository
      .createQueryBuilder('book')
      .select('book.id', 'id')
      .addSelect('book.title', 'title')
      .addSelect('book.author', 'author')
      .addSelect('COUNT(borrowing.id)', 'borrowCount')
      .innerJoin('book.borrowingRecords', 'borrowing')
      .groupBy('book.id')
      .orderBy('"borrowCount"', 'DESC')
      .limit(10)
      .getRawMany();

    return rawData.map((item) => ({
      ...item,
      borrowCount: parseInt(item.borrowCount, 10),
    }));
  }
}
