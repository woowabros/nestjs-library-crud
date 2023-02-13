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
    Raw,
    BaseEntity,
    FindOptionsWhere,
} from 'typeorm';

import { QueryFilter, operatorBetween, operatorIn, operatorNull } from '../interface/query-operation.interface';

export class TypeOrmQueryBuilderHelper {
    static queryFilterToFindOptionsWhere<T extends BaseEntity>(filter: QueryFilter<T>): FindOptionsWhere<T> {
        const findOptionsWhere: Record<string, unknown> = {};
        for (const [field, operation] of Object.entries(filter)) {
            if (typeof operation === 'object' && operation !== null) {
                if ('operator' in operation) {
                    switch (operation.operator) {
                        case '=':
                            findOptionsWhere[field] = operation.operand;
                            break;
                        case '!=':
                            findOptionsWhere[field] = Not(operation.operand);
                            break;
                        case '>':
                            findOptionsWhere[field] = MoreThan(operation.operand);
                            break;
                        case '>=':
                            findOptionsWhere[field] = MoreThanOrEqual(operation.operand);
                            break;
                        case '<':
                            findOptionsWhere[field] = LessThan(operation.operand);
                            break;
                        case '<=':
                            findOptionsWhere[field] = LessThanOrEqual(operation.operand);
                            break;
                        case 'LIKE':
                            findOptionsWhere[field] = Like(operation.operand);
                            break;
                        case 'ILIKE':
                            findOptionsWhere[field] = ILike(operation.operand);
                            break;
                        case '?':
                            findOptionsWhere[field] = Raw((alias) => `${alias} ? :operand`, { operand: operation.operand });
                            break;
                        case '@>':
                            findOptionsWhere[field] = Raw((alias) => `${alias} @> :operand`, { operand: operation.operand });
                            break;
                        case 'JSON_CONTAINS':
                            findOptionsWhere[field] = Raw((alias) => `JSON_CONTAINS (${alias}, :operand)`, { operand: operation.operand });
                            break;
                        case operatorBetween:
                            findOptionsWhere[field] = Between(...operation.operand);
                            break;
                        case operatorIn:
                            findOptionsWhere[field] = In(operation.operand);
                            break;
                        case operatorNull:
                            findOptionsWhere[field] = IsNull();
                            break;
                    }
                }

                if (findOptionsWhere[field] && 'not' in operation && operation.not) {
                    findOptionsWhere[field] = Not(findOptionsWhere[field]);
                }
            }
        }

        return findOptionsWhere as FindOptionsWhere<T>;
    }
}
