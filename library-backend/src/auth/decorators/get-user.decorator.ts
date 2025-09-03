import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ValidatedUser } from '../auth.types';

export const GetUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ValidatedUser => {
    const request = ctx.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return request.user;
  },
);
