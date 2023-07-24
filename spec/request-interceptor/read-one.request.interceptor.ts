import { Injectable } from '@nestjs/common';
import { Request } from 'express';

import { CustomRequestInterceptor, CustomReadOneRequestOptions } from '../../src';

@Injectable()
export class ReadOneRequestInterceptor extends CustomRequestInterceptor {
    async overrideOptions(req: Request): Promise<CustomReadOneRequestOptions> {
        return new Promise((resolve, _reject) => {
            resolve({
                fields: req.params.id === '1' ? ['name', 'createdAt'] : undefined,
                softDeleted: Number(req.params.id) % 2 === 0,
            });
        });
    }
}
