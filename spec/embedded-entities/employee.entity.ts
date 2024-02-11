import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

import { Name } from './name';
import { GROUP } from '../../src/lib/interface';

@Entity()
export class EmployeeEntity {
    @PrimaryGeneratedColumn()
    @Type(() => Number)
    @IsNumber({ allowNaN: false, allowInfinity: false }, { groups: [GROUP.PARAMS] })
    id: string;

    @Column(() => Name)
    @Type(() => Name)
    name: Name;

    @Column()
    @IsNumber({ allowNaN: false, allowInfinity: false }, { always: true })
    @IsOptional({ always: true })
    salary: number;
}
