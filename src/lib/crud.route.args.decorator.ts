import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import { CRUD_ROUTE_ARGS } from './constants';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const CrudRouteArgs = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req[CRUD_ROUTE_ARGS];
});
