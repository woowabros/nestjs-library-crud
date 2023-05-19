import { HttpStatus, INestApplication, forwardRef } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';

import { OverrideCreateController } from './override.create.controller';
import { BaseEntity } from '../base/base.entity';
import { BaseService } from '../base/base.service';
import { TestHelper } from '../test.helper';

describe('OverrideDecorator for CREATE', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [forwardRef(() => TestHelper.getTypeOrmMysqlModule([BaseEntity])), TypeOrmModule.forFeature([BaseEntity])],
            controllers: [OverrideCreateController],
            providers: [BaseService],
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();
    });

    afterEach(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    it('should invoke override method', async () => {
        const routerPathList = TestHelper.getRoutePath(app.getHttpServer());
        expect(routerPathList.post).toEqual(expect.arrayContaining(['/test']));

        const response = await request(app.getHttpServer()).post('/test').send({});

        expect(response.statusCode).toEqual(HttpStatus.CREATED);
        expect(response.body.result).toEqual('createOne');
    });

    it('should not invoke non override method', async () => {
        const routerPathList = TestHelper.getRoutePath(app.getHttpServer());
        expect(routerPathList.post).toEqual(expect.arrayContaining(['/test/search']));

        const response = await request(app.getHttpServer()).post('/test/search').send({});

        expect(response.statusCode).toEqual(HttpStatus.OK);
        expect(response.body.result).not.toBeDefined();
        expect(response.body.data).toBeDefined();
    });
});
