import { IsString } from 'class-validator';
import { ChildEntity, Column, Entity } from 'typeorm';

import { GROUP } from '../../../src';
import { CrudAbstractInheritanceEntity } from '../abstract-inheritance.entity';
import { InheritanceDiscriminatorEnum } from '../inheritance-discriminator.enum';

@Entity('inheritance-b')
@ChildEntity(InheritanceDiscriminatorEnum.B)
export class InheritanceEntityB extends CrudAbstractInheritanceEntity {
    public declare readonly type: InheritanceDiscriminatorEnum.B;

    @Column({ nullable: true })
    @IsString({ groups: [GROUP.CREATE, GROUP.UPDATE, GROUP.READ_MANY, GROUP.UPSERT, GROUP.PARAMS, GROUP.SEARCH] })
    stage: string;
}
