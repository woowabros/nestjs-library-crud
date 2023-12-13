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

@Entity('general')
class GeneralEntity {
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
class TestService extends CrudService<GeneralEntity> {
    constructor(@InjectRepository(GeneralEntity) repository: Repository<GeneralEntity>) {
        super(repository);
    }
}

@Crud({
    entity: GeneralEntity,
    routes: {
        readOne: { exclude: ['col1'] },
        readMany: { exclude: ['col2'] },
        search: { exclude: ['col3'] },
        create: { exclude: ['col4'] },
        update: { exclude: ['col1', 'col2'] },
        delete: { exclude: ['col1', 'col3'] },
        upsert: { exclude: ['col1', 'col4'] },
        recover: { exclude: ['col1', 'col2', 'col3'] },
    },
})
@Controller('general')
class TestController implements CrudController<GeneralEntity> {
    constructor(public readonly crudService: TestService) {}
}

@Module({
    imports: [TypeOrmModule.forFeature([GeneralEntity])],
    controllers: [TestController],
    providers: [TestService],
})
class TestModule {}

describe('Should be used even if it does not extends BaseEntity', () => {
    let app: INestApplication;
    let service: TestService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestModule, TestHelper.getTypeOrmPgsqlModule([GeneralEntity])],
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

    it('should be used GeneralEntity', async () => {
        await service.repository.delete({});

        const name = `Tester-${Date.now()}`;
        const { body: created } = await request(app.getHttpServer()).post('/general').send({ name }).expect(HttpStatus.CREATED);
        expect(created.name).toEqual(name);
        expect(created.id).toBeDefined();

        const { body: readOne } = await request(app.getHttpServer()).get(`/general/${created.id}`).expect(HttpStatus.OK);
        expect(readOne.name).toEqual(name);

        const { body: readMany } = await request(app.getHttpServer()).get('/general').expect(HttpStatus.OK);
        expect(readMany.data).toHaveLength(1);
        expect(readMany.data[0].name).toEqual(name);
        expect(readMany.metadata.total).toEqual(1);

        const { body: updated } = await request(app.getHttpServer())
            .patch(`/general/${created.id}`)
            .send({ name: 'updated' })
            .expect(HttpStatus.OK);
        expect(updated.name).toEqual('updated');

        await request(app.getHttpServer()).delete(`/general/${created.id}`).expect(HttpStatus.OK);
        await request(app.getHttpServer()).get(`/general/${created.id}`).expect(HttpStatus.NOT_FOUND);
    });
});
