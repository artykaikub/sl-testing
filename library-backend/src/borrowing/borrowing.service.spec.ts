/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { BorrowingService } from './borrowing.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BorrowingRecord } from './entities/borrowing-record.entity';
import { DataSource, QueryRunner, Repository } from 'typeorm';
// REFACTORED: Changed to relative paths for Jest compatibility
import { Book } from '../books/entities/book.entity';
import { User, UserRole } from '../users/entities/user.entity';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

// Mock TypeORM Query Runner and its manager
const createMockQueryRunner = () => {
  const qr = {
    manager: {
      getRepository: jest.fn(),
      findOneBy: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    },
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
  };

  // Mock the getRepository to return a mock repository with a createQueryBuilder
  qr.manager.getRepository.mockReturnValue({
    createQueryBuilder: jest.fn().mockReturnThis(),
    setLock: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  });

  return qr as unknown as QueryRunner;
};

describe('BorrowingService', () => {
  let service: BorrowingService;
  let borrowingRepository: Repository<BorrowingRecord>;
  let mockQueryRunner: QueryRunner;

  const mockUser: User = {
    id: 'user-uuid-1',
    username: 'testuser',
    password: 'hashedpassword',
    role: UserRole.MEMBER,
    borrowingRecords: [],
  };

  const mockBook: Book = {
    id: 'book-uuid-1',
    title: 'Test Book',
    author: 'Test Author',
    isbn: '1234567890',
    publicationYear: 2024,
    coverImageUrl: '',
    totalQuantity: 5,
    availableQuantity: 5,
    borrowingRecords: [],
  };

  beforeEach(async () => {
    mockQueryRunner = createMockQueryRunner();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BorrowingService,
        {
          provide: getRepositoryToken(BorrowingRecord),
          useClass: Repository,
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
          },
        },
      ],
    }).compile();

    service = module.get<BorrowingService>(BorrowingService);
    borrowingRepository = module.get<Repository<BorrowingRecord>>(
      getRepositoryToken(BorrowingRecord),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- Tests for borrowBook method ---
  describe('borrowBook', () => {
    it('should allow a user to borrow an available book', async () => {
      // Arrange
      const bookToBorrow = { ...mockBook, availableQuantity: 1 };
      jest
        .spyOn(
          mockQueryRunner.manager.getRepository(Book).createQueryBuilder(),
          'getOne',
        )
        .mockResolvedValue(bookToBorrow);
      jest.spyOn(mockQueryRunner.manager, 'findOneBy').mockResolvedValue(null); // No existing record
      jest
        .spyOn(borrowingRepository, 'create')
        .mockReturnValue({} as BorrowingRecord);
      jest
        .spyOn(mockQueryRunner.manager, 'save')
        .mockResolvedValue({} as BorrowingRecord);

      // Act
      await service.borrowBook(bookToBorrow.id, mockUser.id);

      // Assert
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ availableQuantity: 0 }),
      );
      expect(borrowingRepository.create).toHaveBeenCalledWith({
        book: bookToBorrow,
        user: { id: mockUser.id },
      });
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw NotFoundException if the book does not exist', async () => {
      // Arrange
      jest
        .spyOn(
          mockQueryRunner.manager.getRepository(Book).createQueryBuilder(),
          'getOne',
        )
        .mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.borrowBook('non-existent-id', mockUser.id),
      ).rejects.toThrow(NotFoundException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if the book is not available', async () => {
      // Arrange
      const unavailableBook = { ...mockBook, availableQuantity: 0 };
      jest
        .spyOn(
          mockQueryRunner.manager.getRepository(Book).createQueryBuilder(),
          'getOne',
        )
        .mockResolvedValue(unavailableBook);

      // Act & Assert
      await expect(
        service.borrowBook(unavailableBook.id, mockUser.id),
      ).rejects.toThrow(ConflictException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw ConflictException if the user has already borrowed the book', async () => {
      // Arrange
      jest
        .spyOn(
          mockQueryRunner.manager.getRepository(Book).createQueryBuilder(),
          'getOne',
        )
        .mockResolvedValue(mockBook);
      jest
        .spyOn(mockQueryRunner.manager, 'findOneBy')
        .mockResolvedValue({} as BorrowingRecord); // Found an existing record

      // Act & Assert
      await expect(
        service.borrowBook(mockBook.id, mockUser.id),
      ).rejects.toThrow(ConflictException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  // --- Tests for returnBook method ---
  describe('returnBook', () => {
    const mockBorrowingRecord: BorrowingRecord = {
      id: 'record-uuid-1',
      borrowedAt: new Date(),
      returnedAt: null,
      user: mockUser,
      book: mockBook,
    };

    it('should allow a user to return a borrowed book', async () => {
      // Arrange
      jest
        .spyOn(mockQueryRunner.manager, 'findOne')
        .mockResolvedValue(mockBorrowingRecord);
      const bookToReturn = { ...mockBook, availableQuantity: 0 };
      jest
        .spyOn(
          mockQueryRunner.manager.getRepository(Book).createQueryBuilder(),
          'getOne',
        )
        .mockResolvedValue(bookToReturn);
      jest
        .spyOn(mockQueryRunner.manager, 'save')
        .mockImplementation((entity) => Promise.resolve(entity));

      // Act
      const result = await service.returnBook(
        mockBorrowingRecord.id,
        mockUser.id,
      );

      // Assert
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: bookToReturn.id, availableQuantity: 1 }),
      );
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockBorrowingRecord.id,
          returnedAt: expect.any(Date),
        }),
      );
      expect(result.returnedAt).not.toBeNull();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if the borrowing record is not found', async () => {
      // Arrange
      jest.spyOn(mockQueryRunner.manager, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.returnBook('non-existent-id', mockUser.id),
      ).rejects.toThrow(NotFoundException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user tries to return a book they did not borrow', async () => {
      // Arrange
      const otherUsersRecord = {
        ...mockBorrowingRecord,
        user: { ...mockUser, id: 'another-user-uuid' },
      };
      jest
        .spyOn(mockQueryRunner.manager, 'findOne')
        .mockResolvedValue(otherUsersRecord);

      // Act & Assert
      await expect(
        service.returnBook(otherUsersRecord.id, mockUser.id),
      ).rejects.toThrow(ForbiddenException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });
});
