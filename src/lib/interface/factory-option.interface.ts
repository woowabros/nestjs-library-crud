import type { CrudLogger } from '../provider/crud-logger';
import type { ColumnType } from 'typeorm';

export interface Column {
    name: string;
    type?: ColumnType;
    isPrimary: boolean;
}

export interface FactoryOption {
    logger: CrudLogger;
    columns?: Column[];
    relations: string[];
    primaryKeys: Array<Omit<Column, 'isPrimary'>>;
}
