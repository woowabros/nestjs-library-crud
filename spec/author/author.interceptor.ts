import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';

import type { Observable } from 'rxjs';

@Injectable()
export class AuthorInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<void> {
        const req = context.switchToHttp().getRequest<Request>();
        (req as unknown as Record<string, unknown>)['user'] = 'Request User';
        return next.handle();
    }
}
