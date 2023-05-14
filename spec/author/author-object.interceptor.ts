import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';

import { Author } from './author-object.module';

@Injectable()
export class AuthorInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler) {
        const req: Record<string, any> = context.switchToHttp().getRequest<Request>();
        const author: Author = {
            id: 'ID-1234',
            name: 'name',
            department: 'Request Department',
            modifiedAt: new Date(),
        };
        req['user'] = author;
        return next.handle();
    }
}
