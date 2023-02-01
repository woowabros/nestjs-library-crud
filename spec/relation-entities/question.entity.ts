import { Type } from 'class-transformer';
import { IsString, IsOptional, IsNotEmpty, IsNumber } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { CategoryEntity } from './category.entity';
import { WriterEntity } from './writer.entity';
import { CrudAbstractEntity } from '../../src/lib/abstract';
import { GROUP } from '../../src/lib/interface';

@Entity('question')
export class QuestionEntity extends CrudAbstractEntity {
    @Column('integer', { nullable: false })
    @Type(() => Number)
    @IsNumber({}, { always: true })
    @IsNotEmpty({ groups: [GROUP.CREATE, GROUP.UPSERT] })
    @IsOptional({ groups: [GROUP.UPDATE, GROUP.READ_MANY, GROUP.SEARCH] })
    categoryId: number;

    @ManyToOne(() => CategoryEntity)
    @JoinColumn({ name: 'categoryId' })
    category: CategoryEntity;

    @Column('integer', { nullable: false })
    @Type(() => Number)
    @IsNumber({}, { always: true })
    @IsNotEmpty({ groups: [GROUP.CREATE, GROUP.UPSERT] })
    @IsOptional({ groups: [GROUP.UPDATE, GROUP.READ_MANY, GROUP.SEARCH] })
    writerId: number;

    @ManyToOne(() => WriterEntity)
    @JoinColumn({ name: 'writerId' })
    writer: WriterEntity;

    @Column('varchar', { nullable: false })
    @IsString({ always: true })
    @IsNotEmpty({ groups: [GROUP.CREATE, GROUP.UPSERT] })
    @IsOptional({ groups: [GROUP.UPDATE, GROUP.READ_MANY, GROUP.SEARCH] })
    title: string;

    @Column('varchar', { nullable: false })
    @IsString({ always: true })
    @IsNotEmpty({ groups: [GROUP.CREATE, GROUP.UPSERT] })
    @IsOptional({ groups: [GROUP.UPDATE, GROUP.SEARCH, GROUP.READ_MANY] })
    content: string;
}
