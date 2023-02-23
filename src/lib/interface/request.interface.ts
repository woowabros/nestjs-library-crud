import { DeepPartial } from 'typeorm';

import { PaginationRequest, PrimaryKey, Sort } from '.';
import { RequestSearchDto } from '../dto/request-search.dto';
import { Author } from '../provider';

export type CrudRequestId<T> = keyof T | Array<keyof T>;

export interface CrudRequestBase {
    author?: Author<unknown>;
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

export interface CrudCreateOneRequest<T> extends CrudRequestBase {
    body: DeepPartial<T>;
}

export interface CrudCreateManyRequest<T> extends CrudRequestBase {
    body: Array<DeepPartial<T>>;
}

export function isCrudCreateManyRequest<T>(x: CrudCreateOneRequest<T> | CrudCreateManyRequest<T>): x is CrudCreateManyRequest<T> {
    return Array.isArray(x.body);
}

export type CrudCreateRequest<T> = CrudCreateOneRequest<T> | CrudCreateManyRequest<T>;

export interface CrudUpsertRequest<T> extends CrudCreateOneRequest<T> {
    params: Partial<Record<keyof T, unknown>>;
}

export interface CrudUpdateOneRequest<T> extends CrudCreateOneRequest<T> {
    params: Partial<Record<keyof T, unknown>>;
}

export interface CrudDeleteOneRequest<T> extends CrudRequestBase {
    params: Partial<Record<keyof T, unknown>>;
    softDeleted: boolean;
}

export interface CrudRecoverRequest<T> extends CrudRequestBase {
    params: Partial<Record<keyof T, unknown>>;
}
