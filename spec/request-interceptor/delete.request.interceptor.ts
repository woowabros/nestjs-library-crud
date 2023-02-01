import { Injectable } from '@nestjs/common';
import { Request } from 'express';

import { CustomRequestInterceptor, CustomDeleteRequestOptions } from '../../src';

@Injectable()
export class DeleteRequestInterceptor extends CustomRequestInterceptor {
    async overrideOptions(req: Request): Promise<CustomDeleteRequestOptions> {
        const softDeleted = +req.params.id > 2 ? undefined : false;

        return new Promise((resolve, _reject) => {
            resolve({
                softDeleted,
            });
        });
    }
}
