import {
    Not,
    MoreThan,
    MoreThanOrEqual,
    LessThan,
    LessThanOrEqual,
    Like,
    ILike,
    Between,
    In,
    IsNull,
    BaseEntity,
    FindOptionsWhere,
} from 'typeorm';

import { QueryFilter, operatorBetween, operatorIn, operatorNull } from '../interface/query-operation.interface';

export class TypeOrmQueryBuilderHelper {
    static queryFilterToFindOptionsWhere<T extends BaseEntity>(filter: QueryFilter<T>): FindOptionsWhere<T> {
        const query: Record<string, unknown> = {};
        for (const [field, term] of Object.entries(filter)) {
            if (typeof term === 'object' && term !== null) {
                if ('operator' in term) {
                    switch (term.operator) {
                        case '=':
                            query[field] = term.operand;
                            break;
                        case '!=':
                            query[field] = Not(term.operand);
                            break;
                        case '>':
                            query[field] = MoreThan(term.operand);
                            break;
                        case '>=':
                            query[field] = MoreThanOrEqual(term.operand);
                            break;
                        case '<':
                            query[field] = LessThan(term.operand);
                            break;
                        case '<=':
                            query[field] = LessThanOrEqual(term.operand);
                            break;
                        case 'LIKE':
                            query[field] = Like(term.operand);
                            break;
                        case 'ILIKE':
                            query[field] = ILike(term.operand);
                            break;
                        case operatorBetween:
                            query[field] = Between(...term.operand);
                            break;
                        case operatorIn:
                            query[field] = In(term.operand);
                            break;
                        case operatorNull:
                            query[field] = IsNull();
                            break;
                    }
                }

                if (query[field] && 'not' in term && term.not) {
                    query[field] = Not(query[field]);
                }
            }
        }

        return query as FindOptionsWhere<T>;
    }
}
