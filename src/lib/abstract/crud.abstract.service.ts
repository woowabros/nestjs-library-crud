import { BaseEntity } from 'typeorm';

import {
    PaginationResponse,
    CrudReadManyRequest,
    CrudReadOneRequest,
    CrudSearchRequest,
    CrudCreateRequest,
    CrudUpsertRequest,
    CrudUpdateOneRequest,
    CrudDeleteOneRequest,
    CrudRecoverRequest,
} from '../interface';

/**
 * Rule
 * - Interceptor로부터 전달받는 Request는 첫번째 Argument로 사용합니다.
 */
export type CrudResponseType<T> = Partial<T> | void;
export abstract class CrudAbstractService<T extends BaseEntity> {
    abstract reservedReadMany(req: CrudReadManyRequest<T>): Promise<PaginationResponse<T>>;

    abstract reservedReadOne(req: CrudReadOneRequest<T>): Promise<CrudResponseType<T>>;

    abstract reservedSearch(req: CrudSearchRequest<T>): Promise<{ data: Array<CrudResponseType<T>> }>;

    abstract reservedCreate(req: CrudCreateRequest<T>): Promise<CrudResponseType<T> | Array<CrudResponseType<T>>>;

    abstract reservedUpsert(req: CrudUpsertRequest<T>): Promise<CrudResponseType<T>>;

    abstract reservedUpdate(req: CrudUpdateOneRequest<T>): Promise<CrudResponseType<T>>;

    abstract reservedDelete(req: CrudDeleteOneRequest<T>): Promise<CrudResponseType<T>>;

    abstract reservedRecover(req: CrudRecoverRequest<T>): Promise<CrudResponseType<T>>;
}
