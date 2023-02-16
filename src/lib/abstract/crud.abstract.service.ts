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
export abstract class CrudAbstractService<T extends BaseEntity> {
    abstract reservedReadMany(req: CrudReadManyRequest<T>): Promise<PaginationResponse<T>>;

    abstract reservedReadOne(req: CrudReadOneRequest<T>): Promise<T>;

    abstract reservedSearch(req: CrudSearchRequest<T>): Promise<{ data: T[] }>;

    abstract reservedCreate(req: CrudCreateOneRequest<T>): Promise<T>;
    abstract reservedCreate(req: CrudCreateManyRequest<T>): Promise<T[]>;

    abstract reservedUpsert(req: CrudUpsertRequest<T>): Promise<T>;

    abstract reservedUpdate(req: CrudUpdateOneRequest<T>): Promise<T>;

    abstract reservedDelete(req: CrudDeleteOneRequest<T>): Promise<T>;

    abstract reservedRecover(req: CrudRecoverRequest<T>): Promise<T>;
}
