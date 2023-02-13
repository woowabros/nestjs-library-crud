import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';

import { Constants } from '../constants';

export interface CustomReadOneRequestOptions {
    fields?: string[];
    softDeleted?: boolean;
    relations?: string[];
}
export interface CustomReadManyRequestOptions {
    softDeleted?: boolean;
    relations?: string[];
}
export interface CustomDeleteRequestOptions {
    softDeleted?: boolean;
}
export interface CustomSearchRequestOptions {
    relations?: string[];
}

export class CustomRequestInterceptor implements NestInterceptor {
    async intercept(context: ExecutionContext, next: CallHandler<unknown>): Promise<Observable<unknown>> {
        const req = context.switchToHttp().getRequest<Request>();
        (req as Record<string, any>)[Constants.CUSTOM_REQUEST_OPTIONS] = await this.overrideOptions(req);
        return next.handle();
    }

    /**
     * @description
     * [EN] modify request by override this method. If exists requestOption interface by method, Additional control.
     * [KR] 이 메소드를 오버라이드 하여, Request를 수정할 수 있습니다. 각 메소드에서 제공하는 Options을 통해 추가로 제어할 수 있습니다.
     * @example
     * class MyAuthInterceptor extends CrudCustomRequestInterceptor {
     *   constructor(authService: AuthServer) {}
     *
     *   async overrideOptions(req: Request): Promise<CustomResponseOptions> {
     *     await this.authService.check(req);
     *     return { fields: ['col1', 'col2', 'col3'], softDeleted: true };
     *   }
     * }
     */
    protected async overrideOptions(
        _req: Request,
    ): Promise<
        | CustomReadOneRequestOptions
        | CustomReadManyRequestOptions
        | CustomDeleteRequestOptions
        | CustomSearchRequestOptions
        | undefined
        | void
    > {
        return;
    }
}
