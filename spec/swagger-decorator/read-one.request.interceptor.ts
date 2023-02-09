import { Injectable } from '@nestjs/common';
import { Request } from 'express';

import { CustomRequestInterceptor, CustomReadOneRequestOptions } from '../../src';

@Injectable()
export class ReadOneRequestInterceptor extends CustomRequestInterceptor {
    async overrideOptions(req: Request): Promise<CustomReadOneRequestOptions> {
        return new Promise((resolve, _reject) => {
            if (req.params?.['key']) {
                delete req.params.key;
            }
            resolve({});
        });
    }
}
