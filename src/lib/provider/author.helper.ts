import { Request } from 'express';
import _ from 'lodash';

import { CrudOptions, Method } from '../interface';

export interface Author {
    property: string;
    filter?: string;
    value?: unknown;
}

export class AuthorHelper {
    static extract(
        request: Request | Record<string, unknown>,
        crudOptions: CrudOptions,
        method: Exclude<Method, Method.READ_MANY | Method.READ_ONE | Method.SEARCH>,
    ): Author | undefined {
        if (!crudOptions.routes || !crudOptions.routes[method] || !crudOptions.routes[method]?.author) {
            return;
        }

        return {
            ...crudOptions.routes[method]!.author!,
            value:
                crudOptions.routes[method]!.author?.value ??
                _.get(request, crudOptions.routes[method]!.author!.filter!, crudOptions.routes[method]!.author?.value),
        };
    }
}
