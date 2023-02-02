import { Injectable } from '@nestjs/common';
import { Request } from 'express';

import { CustomRequestInterceptor, CustomReadOneRequestOptions } from '../../src';

@Injectable()
export class ParamsInterceptor extends CustomRequestInterceptor {
    async overrideOptions(req: Request): Promise<CustomReadOneRequestOptions> {
        return new Promise((resolve, _reject) => {
            req.params = { name: req.params?.custom };
            resolve({});
        });
    }
}
