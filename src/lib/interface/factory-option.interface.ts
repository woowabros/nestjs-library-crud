import { ColumnType } from 'typeorm';

export interface Column {
    name: string;
    type?: ColumnType;
    isPrimary: boolean;
}

export interface FactoryOption {
    columns?: Column[];
    primaryKeys?: Array<Omit<Column, 'isPrimary'>>;
}
