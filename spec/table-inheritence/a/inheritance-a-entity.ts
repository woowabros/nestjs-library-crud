import { IsString } from 'class-validator';
import { ChildEntity, Column, Entity } from 'typeorm';

import { GROUP } from '../../../src';
import { CrudAbstractInheritanceEntity } from '../abstract-inheritance.entity';
import { InheritanceDiscriminatorEnum } from '../inheritance-discriminator.enum';

@Entity('inheritance-a')
@ChildEntity(InheritanceDiscriminatorEnum.A)
export class InheritanceEntityA extends CrudAbstractInheritanceEntity {
    public declare readonly type: InheritanceDiscriminatorEnum.A;

    @Column({ nullable: true })
    @IsString({ groups: [GROUP.CREATE, GROUP.UPDATE, GROUP.READ_MANY, GROUP.UPSERT, GROUP.PARAMS, GROUP.SEARCH] })
    name: string;
}
