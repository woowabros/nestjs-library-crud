import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';

import { Author } from './author-object.module';

import type { Observable } from 'rxjs';

@Injectable()
export class AuthorInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<void> {
        const req = context.switchToHttp().getRequest<Request>();
        const author: Author = {
            id: 'ID-1234',
            name: 'name',
            department: 'Request Department',
            modifiedAt: new Date(),
        };
        (req as unknown as Record<string, unknown>)['user'] = author;
        return next.handle();
    }
}
