import { Type } from 'class-transformer';
import { IsString, IsOptional, IsNumber } from 'class-validator';
import { Column, Entity } from 'typeorm';

import { GROUP } from '../../src';
import { CrudAbstractEntity } from '../crud.abstract.entity';

@Entity('depth_two')
export class DepthTwoEntity extends CrudAbstractEntity {
    @Column('varchar', { nullable: true })
    @IsString({ groups: [GROUP.CREATE, GROUP.UPDATE, GROUP.READ_MANY, GROUP.UPSERT, GROUP.PARAMS] })
    @IsOptional({ groups: [GROUP.UPDATE, GROUP.READ_MANY, GROUP.UPDATE, GROUP.SEARCH] })
    parentId: string;

    @Column({ nullable: true })
    @Type(() => Number)
    @IsNumber({}, { groups: [GROUP.CREATE, GROUP.UPDATE, GROUP.READ_MANY, GROUP.UPSERT, GROUP.PARAMS] })
    @IsOptional({ groups: [GROUP.UPDATE, GROUP.READ_MANY, GROUP.UPDATE, GROUP.SEARCH] })
    subId: number;

    @Column('varchar', { nullable: true })
    @IsString({ groups: [GROUP.CREATE, GROUP.UPDATE, GROUP.READ_MANY, GROUP.UPSERT, GROUP.PARAMS] })
    @IsOptional({ groups: [GROUP.CREATE, GROUP.UPDATE, GROUP.READ_MANY, GROUP.UPSERT, GROUP.SEARCH] })
    name: string;
}
