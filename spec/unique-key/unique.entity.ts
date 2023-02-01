import { Type } from 'class-transformer';
import { IsString } from 'class-validator';
import { Column, Entity } from 'typeorm';

import { CrudAbstractEntity } from '../../src/lib/abstract';
import { GROUP } from '../../src/lib/interface';

@Entity('base')
export class UniqueEntity extends CrudAbstractEntity {
    @Column('varchar', { unique: true })
    @IsString({ groups: [GROUP.CREATE, GROUP.UPDATE, GROUP.READ_MANY, GROUP.UPSERT] })
    @Type(() => String)
    name: string;
}
