import { NestInterceptor, Type } from '@nestjs/common';
import { BaseEntity, ColumnType } from 'typeorm';

import { Method, Sort, PaginationType, CrudResponseOptions } from '.';

interface RouteBaseOption {
    decorators?: Array<PropertyDecorator | MethodDecorator>;
    interceptors?: Array<Type<NestInterceptor>>;
    response?: CrudResponseOptions;
    swagger?: boolean;
}

export interface PrimaryKey {
    name: string;
    type?: ColumnType;
}

export interface CrudOptions {
    entity: typeof BaseEntity;
    routes?: {
        [Method.READ_ONE]?: {
            params?: string[];
            softDelete?: boolean;
            relations?: false | string[];
        } & RouteBaseOption;
        [Method.READ_MANY]?: {
            sort?: `${Sort}`;
            paginationType?: `${PaginationType}`;
            numberOfTake?: number;
            relations?: false | string[];
            softDelete?: boolean;
        } & Omit<RouteBaseOption, 'response'>;
        [Method.SEARCH]?: {
            numberOfTake?: number;
            softDelete?: boolean;
            // TODO: search 에서 relation을 처리할 수 있다
            relations?: false | string[];
        } & RouteBaseOption;
        [Method.CREATE]?: RouteBaseOption;
        [Method.UPDATE]?: {
            params?: string[];
        } & RouteBaseOption;
        [Method.DELETE]?: {
            params?: string[];
            softDelete?: boolean;
        } & RouteBaseOption;
        [Method.UPSERT]?: {
            params?: string[];
        } & RouteBaseOption;
        [Method.RECOVER]?: {
            params?: string[];
        } & RouteBaseOption;
    };
    only?: Array<`${Method}`>;
}
