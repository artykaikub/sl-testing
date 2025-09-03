import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { BookResponseDto } from './dto/book-response.dto';
import { MostBorrowedBookDto } from './dto/most-borrowing-book.dto';

@ApiTags('Books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('coverImage'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateBookDto })
  @ApiResponse({
    status: 201,
    description: 'The book has been successfully created.',
    type: BookResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async create(
    @Body() createBookDto: CreateBookDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<BookResponseDto> {
    const bookEntity = await this.booksService.create(
      createBookDto,
      file?.buffer,
      file?.originalname,
    );
    return new BookResponseDto(bookEntity);
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Return all books.',
    type: [BookResponseDto],
  })
  async findAll(): Promise<BookResponseDto[]> {
    const bookEntities = await this.booksService.findAll();
    return bookEntities.map((book) => new BookResponseDto(book));
  }

  @Get('search')
  @ApiQuery({
    name: 'q',
    required: true,
    description: 'Search query for title or author (min 1 character)',
  })
  @ApiResponse({
    status: 200,
    description: 'Return books matching the search query.',
    type: [BookResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., empty query).' })
  async search(@Query('q') query: string): Promise<BookResponseDto[]> {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Search query cannot be empty.');
    }
    const bookEntities = await this.booksService.searchBooks(query);
    return bookEntities.map((book) => new BookResponseDto(book));
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    description: 'Book UUID',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Return a single book by ID.',
    type: BookResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Book not found.' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BookResponseDto> {
    const bookEntity = await this.booksService.findOne(id);
    return new BookResponseDto(bookEntity);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('coverImage'))
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'id',
    description: 'Book UUID',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @ApiBody({ type: UpdateBookDto })
  @ApiResponse({
    status: 200,
    description: 'The book has been successfully updated.',
    type: BookResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Book not found.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBookDto: UpdateBookDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<BookResponseDto> {
    const bookEntity = await this.booksService.update(
      id,
      updateBookDto,
      file?.buffer,
      file?.originalname,
    );
    return new BookResponseDto(bookEntity);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Book UUID',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @ApiResponse({
    status: 204,
    description: 'The book has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Book not found.' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.booksService.remove(id);
  }

  @Get('analytics/most-borrowed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Return top 10 most borrowed books.',
    type: [MostBorrowedBookDto],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async getMostBorrowedBooks(): Promise<MostBorrowedBookDto[]> {
    return this.booksService.getMostBorrowedBooks();
  }
}
