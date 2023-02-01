import { CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { BaseEntity } from 'typeorm';

import { RecoverRequestInterceptor } from './recover-request.interceptor';
import { Constants } from '../constants';
import { ExecutionContextHost } from '../provider';

describe('RecoverRequestInterceptor', () => {
    it('should intercept', async () => {
        class BodyDto extends BaseEntity {
            col1: string;
        }
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const Interceptor = RecoverRequestInterceptor({ entity: BodyDto }, {});
        const interceptor = new Interceptor();
        const handler: CallHandler = {
            handle: () => of('test'),
        };
        const context = new ExecutionContextHost([{}]);
        await interceptor.intercept(context, handler);
        expect(context.switchToHttp().getRequest()).toHaveProperty(Constants.CRUD_ROUTE_ARGS);
    });
});
