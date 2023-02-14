import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { BaseEntity, CreateDateColumn, DeleteDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { GROUP } from '../src/lib/interface';

export class CrudAbstractEntity extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    @IsNumber({}, { groups: [GROUP.PARAMS] })
    @Type(() => Number)
    id: number;

    /**
     * 삭제시간
     */
    @DeleteDateColumn()
    @ApiHideProperty()
    deletedAt?: Date;

    /**
     * 생성시간
     */
    @CreateDateColumn()
    @ApiProperty({ description: '생성시간' })
    createdAt?: Date;

    /**
     * 수정시간
     */
    @UpdateDateColumn()
    @ApiProperty({ description: '수정시간' })
    lastModifiedAt?: Date;
}
