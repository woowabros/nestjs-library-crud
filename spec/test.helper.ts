import { ApplicationConfig } from '@nestjs/core';
import { ModelPropertiesAccessor } from '@nestjs/swagger/dist/services/model-properties-accessor';
import { SchemaObjectFactory } from '@nestjs/swagger/dist/services/schema-object-factory';
import { SwaggerTypesMapper } from '@nestjs/swagger/dist/services/swagger-types-mapper';
import { SwaggerExplorer } from '@nestjs/swagger/dist/swagger-explorer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getMetadataArgsStorage } from 'typeorm';

import type { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import type { DenormalizedDoc } from '@nestjs/swagger/dist/interfaces/denormalized-doc.interface';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { BaseEntity } from 'typeorm';

export class TestHelper {
    static getRoutePath(httpServer: any): Record<string, string[]> {
        return httpServer._events.request.router.stack.reduce(
            (list: Record<string, string[]>, r: { route: { path: string; methods: { method: unknown } } }) => {
                if (r.route?.path) {
                    for (const method of Object.keys(r.route.methods)) {
                        list[method] = list[method] ?? [];
                        list[method].push(r.route.path);
                    }
                }
                return list;
            },
            {},
        );
    }

    static async dropTypeOrmEntityTables() {
        let failCount = 0;
        const metadata = getMetadataArgsStorage();
        const tables = [...metadata.tables];
        while (tables.length > 0) {
            const table = tables.shift()!;
            if (!table.name) {
                return;
            }
            const entity = table.target as typeof BaseEntity;
            if (!entity.query) {
                return;
            }
            await entity.query(`DROP TABLE ${table.name}`).catch((error) => {
                if (failCount++ > 10) {
                    throw error;
                }
                tables.push(table);
            });
        }
    }

    static getTypeOrmMysqlModule(entities: TypeOrmModuleOptions['entities']) {
        return TypeOrmModule.forRoot({
            type: 'mysql',
            bigNumberStrings: false,
            database: process.env.MYSQL_DATABASE_NAME,
            username: process.env.MYSQL_DATABASE_USERNAME,
            password: process.env.MYSQL_DATABASE_PASSWORD,
            entities,
            synchronize: true,
            logging: true,
            logger: 'file',
            dropSchema: true,
        });
    }

    static getTypeOrmPgsqlModule(entities: TypeOrmModuleOptions['entities'], namingStrategy?: TypeOrmModuleOptions['namingStrategy']) {
        return TypeOrmModule.forRoot({
            type: 'postgres',
            database: process.env.POSTGRESQL_DATABASE_NAME,
            username: process.env.POSTGRESQL_DATABASE_USERNAME,
            password: process.env.POSTGRESQL_DATABASE_PASSWORD,
            entities,
            synchronize: true,
            logging: true,
            logger: 'file',
            namingStrategy,
            dropSchema: true,
        });
    }

    static async getTypeOrmMongoModule(url: string, entities: TypeOrmModuleOptions['entities']) {
        return TypeOrmModule.forRoot({
            type: 'mongodb',
            url,
            entities,
            logging: true,
            logger: 'file',
            dropSchema: true,
        });
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    static getSwaggerExplorer(wrapper: InstanceWrapper<object>): Record<string, DenormalizedDoc> {
        const schemaObjectFactory = new SchemaObjectFactory(new ModelPropertiesAccessor(), new SwaggerTypesMapper());
        const explorer = new SwaggerExplorer(schemaObjectFactory);
        const routes = explorer.exploreController(wrapper, new ApplicationConfig());
        return routes.reduce(
            (summary, route) => {
                if (!route.root?.operationId) {
                    return summary;
                }
                summary[`${route.root.method} ${route.root.path}`] = route;
                return summary;
            },
            {} as Record<string, DenormalizedDoc>,
        );
    }
}
