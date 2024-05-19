import { CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { BaseEntity } from 'typeorm';

import { DeleteRequestInterceptor } from './delete-request.interceptor';
import { CRUD_ROUTE_ARGS } from '../constants';
import { ExecutionContextHost } from '../provider';
import { CrudLogger } from '../provider/crud-logger';

describe('DeleteRequestInterceptor', () => {
    it('should intercept', async () => {
        class BodyDto extends BaseEntity {
            col1: string;
        }
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const Interceptor = DeleteRequestInterceptor({ entity: BodyDto }, { relations: [], logger: new CrudLogger(), primaryKeys: [] });
        const interceptor = new Interceptor();

        const handler: CallHandler = {
            handle: () => of('test'),
        };
        const context = new ExecutionContextHost([{}]);
        await interceptor.intercept(context, handler);
        expect(context.switchToHttp().getRequest()).toHaveProperty(CRUD_ROUTE_ARGS);
    });
});
