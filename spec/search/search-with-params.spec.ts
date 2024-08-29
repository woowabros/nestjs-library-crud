import { Controller, Injectable, Module, HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsOptional } from 'class-validator';
import request from 'supertest';
import { Entity, BaseEntity, Repository, PrimaryColumn, Column, ObjectLiteral } from 'typeorm';

import { Crud } from '../../src/lib/crud.decorator';
import { CrudService } from '../../src/lib/crud.service';
import { CrudController } from '../../src/lib/interface';
import { TestHelper } from '../test.helper';

@Entity('test')
class TestEntity extends BaseEntity {
    @PrimaryColumn()
    @IsOptional({ always: true })
    col1: number;

    @Column({ type: 'jsonb', nullable: true })
    @IsOptional({ always: true })
    col2: ObjectLiteral;

    @Column({ type: 'jsonb', nullable: true })
    @IsOptional({ always: true })
    col3: ObjectLiteral;

    @Column()
    @IsOptional({ always: true })
    key: string;
}

@Injectable()
class TestService extends CrudService<TestEntity> {
    constructor(@InjectRepository(TestEntity) repository: Repository<TestEntity>) {
        super(repository);
    }
}

@Crud({ entity: TestEntity })
@Controller('base/:key')
class TestController implements CrudController<TestEntity> {
    constructor(public readonly crudService: TestService) {}
}

@Module({
    imports: [TypeOrmModule.forFeature([TestEntity])],
    controllers: [TestController],
    providers: [TestService],
})
class TestModule {}

describe('Search with params', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestModule, TestHelper.getTypeOrmPgsqlModule([TestEntity])],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();

        for (let i = 0; i < 10; i++) {
            await request(app.getHttpServer())
                .post(`/base/key-${i}`)
                .send({
                    col1: i,
                    col2: [{ multiple2: i % 2 === 0, multiple4: i % 4 === 0 }],
                    col3: [{ multiple3: i % 3 === 0, multiple5: i % 5 === 0 }],
                })
                .expect(HttpStatus.CREATED);
        }
    });

    afterAll(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    it('should be search using params', async () => {
        const { body } = await request(app.getHttpServer()).post('/base/key-1/search').send({}).expect(HttpStatus.OK);
        expect(body.data).toHaveLength(1);
        expect(body.data[0].key).toEqual('key-1');
    });
});
