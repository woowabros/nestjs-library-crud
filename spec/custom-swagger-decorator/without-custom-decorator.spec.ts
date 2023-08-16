import { INestApplication } from '@nestjs/common';
import { SwaggerScanner } from '@nestjs/swagger/dist/swagger-scanner';
import { Test, TestingModule } from '@nestjs/testing';

import { ExtraModel } from './extra-model';
import { DynamicCrudModule } from '../dynamic-crud.module';
import { TestHelper } from '../test.helper';

describe('No custom Swagger Decorator', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [DynamicCrudModule({ readMany: { decorators: [] } })],
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();
    });

    afterAll(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    it('should not include extra model', () => {
        const swaggerScanner = new SwaggerScanner();
        const document = swaggerScanner.scanApplication(app, {});

        expect(document.components?.schemas).not.toHaveProperty(ExtraModel.name);
    });
});
