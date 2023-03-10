import { NestInterceptor, Type } from '@nestjs/common';
import { BaseEntity, ColumnType } from 'typeorm';

import { Method, Sort, PaginationType, Author } from '.';

interface RouteBaseOption {
    decorators?: Array<PropertyDecorator | MethodDecorator>;
    interceptors?: Array<Type<NestInterceptor>>;
    swagger?: {
        hide?: boolean;
        response?: Type<unknown>;
    };
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
            sort?: Sort | `${Sort}`;
            paginationType?: PaginationType | `${PaginationType}`;
            numberOfTake?: number;
            relations?: false | string[];
            softDelete?: boolean;
        } & Omit<RouteBaseOption, 'response'>;
        [Method.SEARCH]?: {
            numberOfTake?: number;
            limitOfTake?: number;
            softDelete?: boolean;
            relations?: false | string[];
        } & RouteBaseOption;
        [Method.CREATE]?: {
            swagger?: {
                body?: Type<unknown>;
            };
            author?: Author;
        } & RouteBaseOption;
        [Method.UPDATE]?: {
            params?: string[];
            swagger?: {
                body?: Type<unknown>;
            };
            author?: Author;
        } & RouteBaseOption;
        [Method.DELETE]?: {
            params?: string[];
            softDelete?: boolean;
            author?: Author;
        } & RouteBaseOption;
        [Method.UPSERT]?: {
            params?: string[];
            swagger?: {
                body?: Type<unknown>;
            };
            author?: Author;
        } & RouteBaseOption;
        [Method.RECOVER]?: {
            params?: string[];
            author?: Author;
        } & RouteBaseOption;
    };
    only?: Array<Method | `${Method}`>;
}
