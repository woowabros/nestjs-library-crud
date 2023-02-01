export enum Method {
    READ_ONE = 'readOne',
    READ_MANY = 'readMany',
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    UPSERT = 'upsert',
    RECOVER = 'recover',
    SEARCH = 'search',
}

export const GROUP = { ...Method, PARAMS: 'params' as const };
