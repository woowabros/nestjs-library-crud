import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

import { Name } from './name';
import { GROUP } from '../../src/lib/interface';

@Entity()
export class UserEntity {
    @PrimaryGeneratedColumn()
    @Type(() => Number)
    @IsNumber({ allowNaN: false, allowInfinity: false }, { groups: [GROUP.PARAMS] })
    id: string;

    @Column(() => Name)
    @Type(() => Name)
    @IsOptional({ always: true })
    @IsObject({ always: true })
    @ValidateNested({ always: true })
    name: Name;

    @Column()
    @Type(() => Boolean)
    @IsBoolean({ always: true })
    @IsOptional({ always: true })
    isActive: boolean;
}
