import { Type } from 'class-transformer';
import { IsString, IsOptional, IsNotEmpty, IsNumber } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { WriterEntity } from './writer.entity';
import { CrudAbstractEntity } from '../../src/lib/abstract';
import { GROUP } from '../../src/lib/interface';

@Entity('comment')
export class CommentEntity extends CrudAbstractEntity {
    @Column('integer', { nullable: false })
    @Type(() => Number)
    @IsNumber({}, { groups: [GROUP.CREATE, GROUP.READ_MANY, GROUP.UPSERT, GROUP.PARAMS] })
    @IsNotEmpty({ groups: [GROUP.CREATE, GROUP.UPSERT] })
    @IsOptional({ groups: [GROUP.READ_MANY] })
    questionId: number;

    @Column('varchar', { nullable: false })
    @IsString({ groups: [GROUP.CREATE, GROUP.UPDATE, GROUP.UPSERT] })
    @IsNotEmpty({ groups: [GROUP.CREATE, GROUP.UPDATE, GROUP.UPSERT] })
    message: string;

    @Column('integer', { nullable: false })
    @Type(() => Number)
    @IsNumber({}, { groups: [GROUP.CREATE, GROUP.READ_MANY, GROUP.UPSERT, GROUP.PARAMS] })
    @IsNotEmpty({ groups: [GROUP.CREATE, GROUP.UPSERT] })
    @IsOptional({ groups: [GROUP.READ_MANY] })
    writerId: number;

    @ManyToOne(() => WriterEntity)
    @JoinColumn({ name: 'writerId' })
    writer: WriterEntity;
}
