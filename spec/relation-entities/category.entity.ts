import { IsString, IsOptional } from 'class-validator';
import { Column, Entity } from 'typeorm';

import { CrudAbstractEntity } from '../../src/lib/abstract';
import { GROUP } from '../../src/lib/interface';

@Entity('category')
export class CategoryEntity extends CrudAbstractEntity {
    @Column('varchar', { nullable: true })
    @IsString({ groups: [GROUP.CREATE, GROUP.UPDATE, GROUP.READ_MANY, GROUP.UPSERT, GROUP.PARAMS] })
    @IsOptional({ groups: [GROUP.CREATE, GROUP.UPDATE, GROUP.READ_MANY, GROUP.UPSERT] })
    name: string;
}
