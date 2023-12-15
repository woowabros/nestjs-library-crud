import crypto from 'crypto';

import { IsOptional, IsString } from 'class-validator';
import { BaseEntity, BeforeInsert, Column, DeleteDateColumn, Entity, PrimaryColumn } from 'typeorm';

import { GROUP } from '../../src/lib/interface';

@Entity('base')
export class MultiplePrimaryKeyEntity extends BaseEntity {
    @PrimaryColumn()
    @IsString({ groups: [GROUP.PARAMS] })
    uuid1: string;

    @PrimaryColumn()
    @IsString({ groups: [GROUP.PARAMS] })
    uuid2: string;

    @IsString({ groups: [GROUP.CREATE, GROUP.UPDATE, GROUP.UPSERT] })
    @IsOptional({ groups: [GROUP.CREATE, GROUP.UPDATE, GROUP.UPSERT] })
    @Column('varchar', { nullable: true })
    name: string;

    @DeleteDateColumn()
    deletedAt?: Date;

    @BeforeInsert()
    setPrimaryKey() {
        this.uuid1 = this.uuid1 ?? `${crypto.getRandomValues(new Uint16Array(1))[0]}${Date.now()}`;
        this.uuid2 = this.uuid2 ?? `${crypto.getRandomValues(new Uint16Array(1))[0]}${Date.now()}`;
    }
}
