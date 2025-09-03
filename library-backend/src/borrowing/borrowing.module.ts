import { Module } from '@nestjs/common';
import { BorrowingService } from './borrowing.service';
import { BorrowingController } from './borrowing.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BorrowingRecord } from './entities/borrowing-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BorrowingRecord])],
  controllers: [BorrowingController],
  providers: [BorrowingService],
})
export class BorrowingModule {}
