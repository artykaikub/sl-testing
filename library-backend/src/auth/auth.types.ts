import { UserRole } from 'src/users/entities/user.entity';

export interface JwtPayload {
  sub: string;
  username: string;
  role: UserRole;
}

export interface ValidatedUser {
  id: string;
  username: string;
  role: UserRole;
}

import { Request } from 'express';
export interface RequestWithUser extends Request {
  user: ValidatedUser;
}
