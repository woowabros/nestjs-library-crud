import { INestApplication } from '@nestjs/common';
import { ApiExtraModels } from '@nestjs/swagger';
import { SwaggerScanner } from '@nestjs/swagger/dist/swagger-scanner';
import { Test, TestingModule } from '@nestjs/testing';

import { ExtraModel } from './extra-model';
import { DynamicCrudModule } from '../dynamic-crud.module';
import { TestHelper } from '../test.helper';

describe('Apply ApiExtraModels Decorator', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [DynamicCrudModule({ readMany: { decorators: [ApiExtraModels(ExtraModel)] } })],
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();
    });

    afterAll(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    it('should include extra model', () => {
        const swaggerScanner = new SwaggerScanner();
        const document = swaggerScanner.scanApplication(app, {});

        expect(document.components?.schemas).toHaveProperty(ExtraModel.name);
    });
});
