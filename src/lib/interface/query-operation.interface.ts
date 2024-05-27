const commonOperatorList = ['=', '!=', '>', '>=', '<', '<=', 'LIKE', 'ILIKE'] as const;
const postgreSQLSpecificOperatorList = ['?', '@>'] as const;
const mySQLSpecificOperatorList = ['JSON_CONTAINS'] as const;

export const operatorList = [...commonOperatorList, ...postgreSQLSpecificOperatorList, ...mySQLSpecificOperatorList] as const;

export const operatorBetween = 'BETWEEN';
export const operatorIn = 'IN';
export const operatorNull = 'NULL';
export const operators = [...operatorList, operatorBetween, operatorIn, operatorNull];
export type OperatorUnion = (typeof operatorList)[number];

export type QueryFilterOperation =
    | { operator: OperatorUnion; operand: unknown; not?: boolean }
    | {
          operator: typeof operatorBetween;
          operand: [unknown, unknown];
          not?: boolean;
      }
    | {
          operator: typeof operatorIn;
          operand: unknown[];
          not?: boolean;
      }
    | { operator: typeof operatorNull; not?: boolean };

export type QueryFilter<T> = {
    [key in keyof Partial<T>]: QueryFilterOperation;
};
