import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    description: 'The JSON Web Token for authenticating subsequent requests.',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Im1lbWJlcjAxIiwic3ViIjoiYWJjZC0xMjM0Iiwicm9sZSI6Im1lbWJlciIsImlhdCI6MTcxNjY0ODAwMCwiZXhwIjoxNzE2NjUyMDAwfQ.fakeTokenSignature',
  })
  accessToken: string;
}
