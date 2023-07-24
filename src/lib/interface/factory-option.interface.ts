import { ColumnType } from 'typeorm';

import { CrudLogger } from '../provider/crud-logger';

export interface Column {
    name: string;
    type?: ColumnType;
    isPrimary: boolean;
}

export interface FactoryOption {
    logger: CrudLogger;
    columns?: Column[];
    relations: string[];
    primaryKeys?: Array<Omit<Column, 'isPrimary'>>;
}
