import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { BaseEntity, CreateDateColumn, DeleteDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { GROUP } from '../interface';

export class CrudAbstractEntity extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'integer' })
    @IsNumber({}, { groups: [GROUP.PARAMS] })
    @Type(() => Number)
    id: number;

    /**
     * 삭제시간
     */
    @DeleteDateColumn({ name: 'deleted_at' })
    @ApiHideProperty()
    deletedAt?: Date;

    /**
     * 생성시간
     */
    @CreateDateColumn({ name: 'created_at' })
    @ApiProperty({ description: '생성시간' })
    createdAt?: Date;

    /**
     * 수정시간
     */
    @UpdateDateColumn({ name: 'last_modified_at' })
    @ApiProperty({ description: '수정시간' })
    lastModifiedAt?: Date;
}
