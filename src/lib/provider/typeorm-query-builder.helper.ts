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
    FindOptionsWhere,
} from 'typeorm';

import { EntityType } from '../interface';
import { QueryFilter, operatorBetween, operatorIn, operatorNull } from '../interface/query-operation.interface';

export class TypeOrmQueryBuilderHelper {
    static queryFilterToFindOptionsWhere<T extends EntityType>(filter: QueryFilter<T>, index: number): FindOptionsWhere<T> {
        const prefix = (() => {
            let num = index;
            let letters = '';
            while (num >= 0) {
                letters = String.fromCharCode(65 + (num % 26)) + letters;
                num = Math.floor(num / 26) - 1;
            }
            return letters;
        })();
        let parametersIndex = 0;
        function getParameterName() {
            return [prefix, parametersIndex++].join('');
        }
        const findOptionsWhere: Record<string, unknown> = {};
        for (const [field, operation] of Object.entries(filter)) {
            if (operation.operator === operatorNull) {
                findOptionsWhere[field] = IsNull();
            }

            if ('operand' in operation) {
                const paramName = getParameterName();
                const { operator, operand } = operation;
                switch (operator) {
                    case '=':
                        findOptionsWhere[field] = operand;
                        break;
                    case '!=':
                        findOptionsWhere[field] = Not(operand);
                        break;
                    case '>':
                        findOptionsWhere[field] = MoreThan(operand);
                        break;
                    case '>=':
                        findOptionsWhere[field] = MoreThanOrEqual(operand);
                        break;
                    case '<':
                        findOptionsWhere[field] = LessThan(operand);
                        break;
                    case '<=':
                        findOptionsWhere[field] = LessThanOrEqual(operand);
                        break;
                    case 'LIKE':
                        findOptionsWhere[field] = Like(operand);
                        break;
                    case 'ILIKE':
                        findOptionsWhere[field] = ILike(operand);
                        break;
                    case '?':
                        findOptionsWhere[field] = Raw((alias) => `${alias} ? :${paramName}`, {
                            [paramName]: operand,
                        });
                        break;
                    case '@>':
                        findOptionsWhere[field] = Raw((alias) => `${alias} @> :${paramName}`, {
                            [paramName]: operand,
                        });
                        break;
                    case 'JSON_CONTAINS':
                        findOptionsWhere[field] = Raw((alias) => `JSON_CONTAINS (${alias}, :${paramName})`, {
                            [paramName]: operand,
                        });
                        break;
                    case operatorBetween:
                        const [min, max] = operand;
                        findOptionsWhere[field] = Between(min, max);
                        break;
                    case operatorIn:
                        findOptionsWhere[field] = In(operand);
                        break;
                }
            }

            if (findOptionsWhere[field] && 'not' in operation && operation.not) {
                findOptionsWhere[field] = Not(findOptionsWhere[field]);
            }
        }

        return findOptionsWhere as FindOptionsWhere<T>;
    }
}
