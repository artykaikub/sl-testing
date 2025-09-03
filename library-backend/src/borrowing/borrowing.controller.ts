import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/users/entities/user.entity';
import { BorrowingService } from './borrowing.service';
import * as authTypes from 'src/auth/auth.types';
import { BorrowingRecordResponseDto } from './dto/borrowing-record-response.dto';

@ApiTags('Borrowing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('borrowing')
export class BorrowingController {
  constructor(private readonly borrowingService: BorrowingService) {}

  @Post('borrow/:bookId')
  @Roles(UserRole.MEMBER)
  @ApiParam({
    name: 'bookId',
    description: 'Book UUID to borrow',
    example: '456a4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 201,
    description: 'Successfully borrowed the book.',
    type: BorrowingRecordResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict. Book is unavailable or already borrowed.',
  })
  async borrowBook(
    @Param('bookId', ParseUUIDPipe) bookId: string,
    @GetUser() user: authTypes.ValidatedUser,
  ): Promise<BorrowingRecordResponseDto> {
    const recordEntity = await this.borrowingService.borrowBook(
      bookId,
      user.id,
    );
    return new BorrowingRecordResponseDto(recordEntity);
  }

  @Post('return/:recordId')
  @Roles(UserRole.MEMBER)
  @ApiParam({
    name: 'recordId',
    description: 'Borrowing Record UUID to return',
    example: '789b4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully returned the book.',
    type: BorrowingRecordResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Active borrowing record not found.',
  })
  async returnBook(
    @Param('recordId', ParseUUIDPipe) recordId: string,
    @GetUser() user: authTypes.ValidatedUser,
  ): Promise<BorrowingRecordResponseDto> {
    const recordEntity = await this.borrowingService.returnBook(
      recordId,
      user.id,
    );
    return new BorrowingRecordResponseDto(recordEntity);
  }

  @Get('history/me')
  @Roles(UserRole.MEMBER, UserRole.LIBRARIAN, UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: "Return the current user's borrowing history.",
    type: [BorrowingRecordResponseDto],
  })
  async getMyHistory(
    @GetUser() user: authTypes.ValidatedUser,
  ): Promise<BorrowingRecordResponseDto[]> {
    const records = await this.borrowingService.getMyHistory(user.id);
    return records.map((record) => new BorrowingRecordResponseDto(record));
  }

  @Get('history/all')
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: 'Return all borrowing history for admins/librarians.',
    type: [BorrowingRecordResponseDto],
  })
  async getAllHistory(): Promise<BorrowingRecordResponseDto[]> {
    const records = await this.borrowingService.getAllHistory();
    return records.map((record) => new BorrowingRecordResponseDto(record));
  }
}
