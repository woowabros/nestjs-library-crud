import { Injectable } from '@nestjs/common';
import { Request } from 'express';

import { CustomRequestInterceptor, CustomRequestOptions } from '../../src';

@Injectable()
export class ReadManyRequestInterceptor extends CustomRequestInterceptor {
    async overrideOptions(_req: Request): Promise<CustomRequestOptions> {
        return new Promise((resolve, _reject) => {
            resolve({
                softDeleted: true,
            });
        });
    }
}
