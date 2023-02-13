import { IsString, IsOptional } from 'class-validator';
import { Column, Entity } from 'typeorm';

import { GROUP } from '../../src';
import { CrudAbstractEntity } from '../crud.abstract.entity';

@Entity('depth_one')
export class DepthOneEntity extends CrudAbstractEntity {
    @Column()
    @IsString({ groups: [GROUP.CREATE, GROUP.UPDATE, GROUP.READ_MANY, GROUP.UPSERT, GROUP.PARAMS] })
    @IsOptional({ groups: [GROUP.UPDATE, GROUP.READ_MANY, GROUP.UPDATE, GROUP.SEARCH] })
    parentId: string;

    @Column({ nullable: true })
    @IsString({ groups: [GROUP.CREATE, GROUP.UPDATE, GROUP.READ_MANY, GROUP.UPSERT, GROUP.PARAMS] })
    @IsOptional({ groups: [GROUP.CREATE, GROUP.UPDATE, GROUP.READ_MANY, GROUP.UPSERT, GROUP.SEARCH] })
    name: string;
}
