import { Injectable } from '@nestjs/common';
import { Request } from 'express';

import { CustomRequestInterceptor } from '../../src';

@Injectable()
export class ParamsRequestInterceptor extends CustomRequestInterceptor {
    async overrideOptions(req: Request): Promise<void> {
        return new Promise((resolve, _reject) => {
            if (req.params?.['key']) {
                delete req.params.key;
            }
            resolve();
        });
    }
}
