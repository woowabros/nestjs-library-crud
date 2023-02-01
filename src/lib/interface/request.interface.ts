import { DeepPartial } from 'typeorm';

import { PrimaryKey, Sort, PaginationRequest, CrudResponseOptions } from '.';
import { RequestSearchDto } from '../dto/request-search.dto';

export type CrudRequestId<T> = keyof T | Array<keyof T>;

export interface CrudRequestBase {
    options?: {
        response?: CrudResponseOptions;
    };
}

export interface CrudReadRequestBase extends CrudRequestBase {
    softDeleted?: boolean;
    relations?: string[];
}

export interface CrudReadManyRequest<T> extends CrudReadRequestBase {
    query?: Partial<Record<keyof T, unknown>>;
    sort: Sort;
    primaryKeys: PrimaryKey[];
    pagination: PaginationRequest;
    numberOfTake: number;
}

export interface CrudReadOneRequest<T> extends CrudReadRequestBase {
    fields?: Partial<Record<keyof T, unknown>>;
    params: Partial<Record<keyof T, unknown>>;
}

export interface CrudSearchRequest<T> extends CrudRequestBase {
    requestSearchDto: RequestSearchDto<T>;
    relations?: string[];
}

export interface CrudCreateRequest<T> extends CrudRequestBase {
    body: DeepPartial<T> | Array<DeepPartial<T>>;
}

export interface CrudUpsertRequest<T> extends CrudCreateRequest<T> {
    params: Partial<Record<keyof T, unknown>>;
}

export interface CrudUpdateOneRequest<T> extends CrudCreateRequest<T> {
    params: Partial<Record<keyof T, unknown>>;
}

export interface CrudDeleteOneRequest<T> extends CrudRequestBase {
    params: Partial<Record<keyof T, unknown>>;
    softDeleted: boolean;
}

export interface CrudRecoverRequest<T> extends CrudRequestBase {
    params: Partial<Record<keyof T, unknown>>;
}
