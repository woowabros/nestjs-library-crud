import {
    Brackets,
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
    NotBrackets,
    WhereExpressionBuilder,
    BaseEntity,
} from 'typeorm';

import { QueryFilter, operatorBetween, operatorIn, operatorNull } from '../interface/query-operation.interface';

export class TypeOrmQueryBuilderHelper {
    static brackets<T extends BaseEntity>(filter: QueryFilter<T>): Brackets {
        return new Brackets(this.whereFactory<T>(filter));
    }

    static notBrackets<T extends BaseEntity>(filter: QueryFilter<T>): NotBrackets {
        return new NotBrackets(this.whereFactory<T>(filter));
    }

    static whereFactory<T extends BaseEntity>(filter: QueryFilter<T>) {
        return (qb: WhereExpressionBuilder) => {
            const func = qb.andWhere.bind(qb);
            for (const [field, term] of Object.entries(filter)) {
                if (typeof term === 'object' && term !== null && 'operator' in term) {
                    switch (term.operator) {
                        case '=':
                            func({ [field]: term.operand });
                            break;
                        case '!=':
                            func({ [field]: Not(term.operand) });
                            break;
                        case '>':
                            func({ [field]: MoreThan(term.operand) });
                            break;
                        case '>=':
                            func({ [field]: MoreThanOrEqual(term.operand) });
                            break;
                        case '<':
                            func({ [field]: LessThan(term.operand) });
                            break;
                        case '<=':
                            func({ [field]: LessThanOrEqual(term.operand) });
                            break;
                        case 'LIKE':
                            func({ [field]: Like(term.operand) });
                            break;
                        case 'ILIKE':
                            func({ [field]: ILike(term.operand) });
                            break;
                        case operatorBetween:
                            func({ [field]: Between(...term.operand) });
                            break;
                        case operatorIn:
                            func({ [field]: In(term.operand) });
                            break;
                        case operatorNull:
                            func({ [field]: IsNull() });
                            break;
                    }
                }
            }
        };
    }
}
