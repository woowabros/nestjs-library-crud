import { IsOptional, IsString } from 'class-validator';
import { Column } from 'typeorm';

export class Name {
    @Column({ nullable: true, default: 'first' })
    @IsString({ always: true })
    @IsOptional({ always: true })
    first: string;

    @Column({ nullable: true, default: 'last' })
    @IsString({ always: true })
    @IsOptional({ always: true })
    last: string;
}
