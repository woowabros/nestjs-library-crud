export const operatorList = ['=', '!=', '>', '>=', '<', '<=', 'LIKE', 'ILIKE'] as const;
export const operatorBetween = 'BETWEEN' as const;
export const operatorIn = 'IN' as const;
export const operatorNull = 'NULL' as const;
export type OperatorUnion = (typeof operatorList)[number];

export type QueryFilterOperator =
    | { operator: OperatorUnion; operand: unknown }
    | {
          operator: typeof operatorBetween;
          operand: [unknown, unknown];
      }
    | {
          operator: typeof operatorIn;
          operand: unknown[];
      }
    | { operator: typeof operatorNull };

export type QueryFilter<T> = {
    [key in keyof Partial<T>]: QueryFilterOperator;
};
