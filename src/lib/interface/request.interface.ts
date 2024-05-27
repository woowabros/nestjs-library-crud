import type { Author, SaveOptions } from '.';
import type { RequestSearchDto } from '../dto/request-search.dto';
import type { DeepPartial } from 'typeorm';

export type CrudRequestId<T> = keyof T | Array<keyof T>;

export interface CrudRequestBase {
    author?: Author;
}

export interface CrudReadRequestBase extends CrudRequestBase {
    softDeleted?: boolean;
    relations: string[];
}

export interface CrudReadOneRequest<T> extends CrudReadRequestBase {
    selectColumns?: string[];
    excludedColumns?: string[];
    params: Partial<Record<keyof T, unknown>>;
}

export interface CrudSearchRequest<T> extends CrudRequestBase {
    requestSearchDto: RequestSearchDto<T>;
    relations: string[];
}

export interface CrudCreateOneRequest<T> extends CrudRequestBase {
    body: DeepPartial<T>;
    exclude: Set<string>;
    saveOptions?: SaveOptions;
}

export interface CrudCreateManyRequest<T> extends CrudRequestBase {
    body: Array<DeepPartial<T>>;
    exclude: Set<string>;
    saveOptions?: SaveOptions;
}

export function isCrudCreateManyRequest<T>(x: CrudCreateOneRequest<T> | CrudCreateManyRequest<T>): x is CrudCreateManyRequest<T> {
    return Array.isArray(x.body);
}

export type CrudCreateRequest<T> = CrudCreateOneRequest<T> | CrudCreateManyRequest<T>;

export interface CrudUpsertRequest<T> extends CrudCreateOneRequest<T> {
    params: Partial<Record<keyof T, unknown>>;
    saveOptions: SaveOptions;
}

export interface CrudUpdateOneRequest<T> extends CrudCreateOneRequest<T> {
    params: Partial<Record<keyof T, unknown>>;
    saveOptions: SaveOptions;
}

export interface CrudDeleteOneRequest<T> extends CrudRequestBase {
    params: Partial<Record<keyof T, unknown>>;
    softDeleted: boolean;
    exclude: Set<string>;
    saveOptions: SaveOptions;
}

export interface CrudRecoverRequest<T> extends CrudRequestBase {
    params: Partial<Record<keyof T, unknown>>;
    exclude: Set<string>;
    saveOptions: SaveOptions;
}
