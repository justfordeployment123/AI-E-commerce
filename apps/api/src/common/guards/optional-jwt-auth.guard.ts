import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
    handleRequest(_err: unknown, user: unknown) {
        // Unlike JwtAuthGuard, never throw — just return user or null
        return user ?? null;
    }

    canActivate(context: ExecutionContext) {
        return super.canActivate(context);
    }
}
