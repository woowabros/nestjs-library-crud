import { Injectable } from '@nestjs/common';
import { Request } from 'express';

import { CustomRequestInterceptor, CustomReadManyRequestOptions } from '../../src';

@Injectable()
export class ReadManyRequestInterceptor extends CustomRequestInterceptor {
    async overrideOptions(_req: Request): Promise<CustomReadManyRequestOptions> {
        return new Promise((resolve, _reject) => {
            resolve({
                softDeleted: true,
            });
        });
    }
}
