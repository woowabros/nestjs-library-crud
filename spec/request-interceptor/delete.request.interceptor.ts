import { Injectable } from '@nestjs/common';
import { Request } from 'express';

import { CustomRequestInterceptor, CustomRequestOptions } from '../../src';

@Injectable()
export class DeleteRequestInterceptor extends CustomRequestInterceptor {
    async overrideOptions(req: Request): Promise<CustomRequestOptions> {
        const softDeleted = +req.params.id > 2 ? undefined : false;

        return new Promise((resolve, _reject) => {
            resolve({
                softDeleted,
            });
        });
    }
}
