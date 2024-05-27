import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { SwaggerDecoratorController } from './swagger-decorator.controller';
import { SwaggerDecoratorModule } from './swagger-decorator.module';
import { BaseEntity } from '../base/base.entity';
import { TestHelper } from '../test.helper';

import type { INestApplication } from '@nestjs/common';
import type { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import type { DenormalizedDoc } from '@nestjs/swagger/dist/interfaces/denormalized-doc.interface';
import type { RequestBodyObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import type { TestingModule } from '@nestjs/testing';

describe('SwaggerDecorator', () => {
    let app: INestApplication;
    let routeSet: Record<string, DenormalizedDoc>;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [SwaggerDecoratorModule, TestHelper.getTypeOrmMysqlModule([BaseEntity])],
        }).compile();

        app = moduleFixture.createNestApplication();
        const controller = moduleFixture.get<SwaggerDecoratorController>(SwaggerDecoratorController);

        await app.init();

        routeSet = TestHelper.getSwaggerExplorer({
            instance: controller,
            metatype: SwaggerDecoratorController,
        } as InstanceWrapper<SwaggerDecoratorController>);
    });

    afterAll(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    it('should be added swagger decorator', async () => {
        const routerPathList = TestHelper.getRoutePath(app.getHttpServer());
        expect(routerPathList.get).toEqual(expect.arrayContaining(['/swagger-decorator/:key/:id', '/swagger-decorator/:key']));

        const { body: readManyBody } = await request(app.getHttpServer())
            .post('/swagger-decorator/123')
            .send({ name: 'name' })
            .expect(HttpStatus.CREATED);
        expect(readManyBody.name).toEqual('name');

        const { body: readManyBodyBy456 } = await request(app.getHttpServer()).get('/swagger-decorator/456').expect(HttpStatus.OK);
        expect(readManyBodyBy456.data).toHaveLength(1);
        expect(readManyBodyBy456.data[0].name).toEqual('name');

        const { body: readOneBody } = await request(app.getHttpServer())
            .get(`/swagger-decorator/456/${readManyBody.id}`)
            .expect(HttpStatus.OK);
        expect(readOneBody.name).toEqual('name');
    });

    it('should be override swagger decorator', async () => {
        expect((routeSet['patch /swagger-decorator/{key}/{id}'].root?.requestBody as RequestBodyObject)?.description).toEqual(
            'UpdateBaseDto',
        );
    });
});
