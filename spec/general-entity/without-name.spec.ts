/* eslint-disable max-classes-per-file */
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Controller, Injectable, Module } from '@nestjs/common';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Test, TestingModule } from '@nestjs/testing';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import request from 'supertest';
import { Entity, Repository, Column, DeleteDateColumn, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

import { Crud } from '../../src/lib/crud.decorator';
import { CrudService } from '../../src/lib/crud.service';
import { CrudController, GROUP } from '../../src/lib/interface';
import { TestHelper } from '../test.helper';

@Entity()
class NoNamedEntity {
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

@Injectable()
class TestService extends CrudService<NoNamedEntity> {
    constructor(@InjectRepository(NoNamedEntity) repository: Repository<NoNamedEntity>) {
        super(repository);
    }
}

@Crud({
    entity: NoNamedEntity,
})
@Controller('no-named')
class TestController implements CrudController<NoNamedEntity> {
    constructor(public readonly crudService: TestService) {}
}

@Module({
    imports: [TypeOrmModule.forFeature([NoNamedEntity])],
    controllers: [TestController],
    providers: [TestService],
})
class TestModule {}

describe('Should be used even if it does not defined name', () => {
    let app: INestApplication;
    let service: TestService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestModule, TestHelper.getTypeOrmPgsqlModule([NoNamedEntity])],
        }).compile();
        app = moduleFixture.createNestApplication();

        service = app.get<TestService>(TestService);
        await app.init();
    });

    afterAll(async () => {
        await app?.close();
    });

    it('should be defined', () => {
        expect(app).toBeDefined();
    });

    it('should be used NoNamedEntity', async () => {
        await service.repository.delete({});

        const name = `Tester-${Date.now()}`;
        const { body: created } = await request(app.getHttpServer()).post('/no-named').send({ name }).expect(HttpStatus.CREATED);
        expect(created.name).toEqual(name);
        expect(created.id).toBeDefined();

        const { body: readOne } = await request(app.getHttpServer()).get(`/no-named/${created.id}`).expect(HttpStatus.OK);
        expect(readOne.name).toEqual(name);

        const { body: readMany } = await request(app.getHttpServer()).get('/no-named').expect(HttpStatus.OK);
        expect(readMany.data).toHaveLength(1);
        expect(readMany.data[0].name).toEqual(name);
        expect(readMany.metadata.total).toEqual(1);

        const { body: updated } = await request(app.getHttpServer())
            .patch(`/no-named/${created.id}`)
            .send({ name: 'updated' })
            .expect(HttpStatus.OK);
        expect(updated.name).toEqual('updated');

        await request(app.getHttpServer()).delete(`/no-named/${created.id}`).expect(HttpStatus.OK);
        await request(app.getHttpServer()).get(`/no-named/${created.id}`).expect(HttpStatus.NOT_FOUND);
    });
});
