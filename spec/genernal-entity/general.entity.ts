import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsNumber } from 'class-validator';
import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { GROUP } from '../../src/lib/interface';

@Entity('general')
export class GeneralEntity {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    @ApiProperty({ description: 'ID' })
    @IsNumber({}, { groups: [GROUP.PARAMS] })
    @Type(() => Number)
    id: number;

    @Column()
    @ApiProperty({ description: 'Name' })
    @IsString({ always: true })
    @IsOptional({ groups: [GROUP.CREATE, GROUP.UPDATE, GROUP.READ_MANY, GROUP.UPSERT, GROUP.SEARCH] })
    name: string;

    @Column({ nullable: true })
    @ApiProperty({ description: 'Description' })
    @IsString({ always: true })
    @IsOptional({ always: true })
    description: string;

    @CreateDateColumn()
    @ApiProperty({ description: 'Created At' })
    createdAt: Date;

    @UpdateDateColumn()
    @ApiProperty({ description: 'Last Modified At' })
    updatedAt: Date;

    @DeleteDateColumn()
    @ApiHideProperty()
    deletedAt?: Date;
}
