import { IsEnum } from 'class-validator';
import { Column, Entity, TableInheritance } from 'typeorm';

import { InheritanceDiscriminatorEnum } from './inheritance-discriminator.enum';
import { GROUP } from '../../src';
import { CrudAbstractEntity } from '../crud.abstract.entity';

@Entity('inheritance')
@TableInheritance({
    column: 'type',
})
export class CrudAbstractInheritanceEntity extends CrudAbstractEntity {
    @Column({ nullable: false, type: 'enum' })
    @IsEnum({ groups: [GROUP.CREATE, GROUP.UPDATE, GROUP.READ_MANY, GROUP.UPSERT, GROUP.PARAMS, GROUP.SEARCH] })
    public type: InheritanceDiscriminatorEnum;
}
