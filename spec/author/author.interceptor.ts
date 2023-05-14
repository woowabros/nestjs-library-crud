import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import _ from 'lodash';

@Injectable()
export class AuthorInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler) {
        const req: Record<string, any> = context.switchToHttp().getRequest<Request>();
        req['user'] = 'Request User';
        return next.handle();
    }
}
