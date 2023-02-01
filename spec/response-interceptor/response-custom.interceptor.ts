import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import _ from 'lodash';
import { Observable, map } from 'rxjs';

@Injectable()
export class ResponseCustomInterceptor implements NestInterceptor {
    intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
        return next.handle().pipe(
            map((data) => {
                if (_.isNil(data)) {
                    return data;
                }
                return data.id === 2
                    ? data
                    : {
                          ..._.omit(data, ['deletedAt', 'lastModifiedAt']),
                          createdAt: +data.createdAt,
                          custom: Date.now(),
                      };
            }),
        );
    }
}
