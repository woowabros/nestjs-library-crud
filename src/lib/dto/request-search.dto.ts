import { Sort } from '../interface';
import { QueryFilter } from '../interface/query-operation.interface';

export class RequestSearchDto<T> {
    select?: Array<keyof Partial<T>>;
    where?: {
        $and?: Array<QueryFilter<T>>;
        $or?: Array<QueryFilter<T>>;
        $not?: Array<QueryFilter<T>>;
    };
    order?: {
        [key in keyof Partial<T>]: Sort;
    };
    withDeleted?: boolean;
    take?: number;
}
