import { Request } from 'express';

import { CrudOptions, Method } from '../interface';

export interface Author<T> {
    key: string;
    value: T;
}

export class AuthorHelper {
    static extract(
        request: Request | Record<string, unknown>,
        crudOptions: CrudOptions,
        method: Exclude<Method, Method.READ_MANY | Method.READ_ONE | Method.SEARCH>,
    ): Author<unknown> | undefined {
        if (!crudOptions.routes || !crudOptions.routes[method] || !crudOptions.routes[method]?.author) {
            return;
        }
        return {
            key: crudOptions.routes[method]!.author!.value,
            value: (request as Record<string, any>)[crudOptions.routes[method]!.author!.key],
        };
    }
}
