import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { CategoryEntity } from './category.entity';
import { CommentEntity } from './comment.entity';
import { WriterEntity } from './writer.entity';
import { GROUP } from '../../src';
import { CrudAbstractEntity } from '../crud.abstract.entity';

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

    @OneToMany(() => CommentEntity, (comment) => comment.question)
    comments: CommentEntity[];
}
