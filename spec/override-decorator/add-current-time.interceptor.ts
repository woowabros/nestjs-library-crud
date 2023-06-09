import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

import { CRUD_ROUTE_ARGS } from '../../src';

@Injectable()
export class AddCurrentTimeInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        req[CRUD_ROUTE_ARGS].body.time = Date.now();
        return next.handle();
    }
}
