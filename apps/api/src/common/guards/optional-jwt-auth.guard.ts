import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleRequest<TUser = any>(_err: any, user: any): TUser {
        return user ?? null;
    }

    canActivate(context: ExecutionContext) {
        return super.canActivate(context);
    }
}
