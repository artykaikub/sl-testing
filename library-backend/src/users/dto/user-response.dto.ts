import { ApiProperty } from '@nestjs/swagger';
import { User, UserRole } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The unique identifier of the user.',
  })
  id: string;

  @ApiProperty({
    example: 'john.doe',
    description: "The user's unique username.",
  })
  username: string;

  @ApiProperty({
    example: UserRole.MEMBER,
    enum: UserRole,
    description: "The user's role.",
  })
  role: UserRole;

  @ApiProperty({
    description: 'The timestamp when the user was created.',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The timestamp when the user was last updated.',
  })
  updatedAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.username = user.username;
    this.role = user.role;
  }
}
