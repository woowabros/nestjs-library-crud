export const operatorList = ['=', '!=', '>', '>=', '<', '<=', 'LIKE', 'ILIKE'] as const;
export const operatorBetween = 'BETWEEN' as const;
export const operatorIn = 'IN' as const;
export const operatorNull = 'NULL' as const;
export type OperatorUnion = (typeof operatorList)[number];

export type QueryFilterOperator =
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
    [key in keyof Partial<T>]: QueryFilterOperator;
};
