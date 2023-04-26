import { CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

import { CustomRequestInterceptor } from './custom-request.interceptor';
import { CUSTOM_REQUEST_OPTIONS } from '../constants';
import { ExecutionContextHost } from '../provider';

describe('CustomRequestInterceptor', () => {
    it('should intercept', async () => {
        const handler: CallHandler = {
            handle: () => of('test'),
        };
        const interceptor: CustomRequestInterceptor = new CustomRequestInterceptor();

        const context = new ExecutionContextHost([{}]);

        await interceptor.intercept(context, handler);
        expect(context.switchToHttp().getRequest()).toHaveProperty(CUSTOM_REQUEST_OPTIONS);
    });
});
