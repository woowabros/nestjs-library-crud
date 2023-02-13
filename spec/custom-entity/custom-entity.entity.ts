import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { BaseEntity, BeforeInsert, Column, DeleteDateColumn, Entity, PrimaryColumn } from 'typeorm';

import { GROUP } from '../../src/lib/interface';

@Entity('base')
export class CustomEntity extends BaseEntity {
    @PrimaryColumn()
    @IsString({ groups: [GROUP.PARAMS, GROUP.SEARCH] })
    @IsOptional({ groups: [GROUP.SEARCH] })
    uuid: string;

    @Column({ nullable: true })
    @IsString({ groups: [GROUP.CREATE, GROUP.UPSERT, GROUP.SEARCH] })
    @IsNotEmpty({ groups: [GROUP.CREATE] })
    @IsOptional({ groups: [GROUP.UPSERT, GROUP.SEARCH] })
    name: string;

    @Column('varchar', { nullable: true })
    @IsString({ groups: [GROUP.CREATE, GROUP.UPDATE, GROUP.UPSERT, GROUP.SEARCH] })
    @IsOptional({ groups: [GROUP.CREATE, GROUP.UPDATE, GROUP.UPSERT, GROUP.SEARCH] })
    descriptions?: string;

    @DeleteDateColumn()
    deletedAt?: Date;

    @BeforeInsert()
    setPrimaryKey() {
        this.uuid = this.uuid ?? `${Date.now()}${Math.floor(Math.random() * 10_000)}`;
    }
}
