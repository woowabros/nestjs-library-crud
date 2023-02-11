import { BaseEntity } from 'typeorm';

import {
    CrudCreateManyRequest,
    CrudCreateOneRequest,
    CrudDeleteOneRequest,
    CrudReadManyRequest,
    CrudReadOneRequest,
    CrudRecoverRequest,
    CrudSearchRequest,
    CrudUpdateOneRequest,
    CrudUpsertRequest,
    PaginationResponse,
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

    abstract reservedCreate(req: CrudCreateOneRequest<T>): Promise<CrudResponseType<T>>;
    abstract reservedCreate(req: CrudCreateManyRequest<T>): Promise<Array<CrudResponseType<T>>>;

    abstract reservedUpsert(req: CrudUpsertRequest<T>): Promise<CrudResponseType<T>>;

    abstract reservedUpdate(req: CrudUpdateOneRequest<T>): Promise<CrudResponseType<T>>;

    abstract reservedDelete(req: CrudDeleteOneRequest<T>): Promise<CrudResponseType<T>>;

    abstract reservedRecover(req: CrudRecoverRequest<T>): Promise<CrudResponseType<T>>;
}
