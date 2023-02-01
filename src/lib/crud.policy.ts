import { HttpStatus, NestInterceptor, RequestMethod, Type } from '@nestjs/common';
import { BaseEntity } from 'typeorm';

import { ReadOneRequestInterceptor, CreateRequestInterceptor } from './interceptor';
import { DeleteRequestInterceptor } from './interceptor/delete-request.interceptor';
import { ReadManyRequestInterceptor } from './interceptor/read-many-request.interceptor';
import { RecoverRequestInterceptor } from './interceptor/recover-request.interceptor';
import { SearchRequestInterceptor } from './interceptor/search-request.interceptor';
import { UpdateRequestInterceptor } from './interceptor/update-request.interceptor';
import { UpsertRequestInterceptor } from './interceptor/upsert-request.interceptor';
import { CrudOptions, Method, CrudResponseOption, PrimaryKey, FactoryOption, Sort, PaginationType } from './interface';
import { capitalizeFirstLetter } from './util';

interface CrudMethodPolicy {
    method: RequestMethod; // Method (Get, Post, Patch ...)
    response: CrudResponseOption; // Response Type
    useBody: boolean; // included body
    interceptor: (crudOptions: CrudOptions, factoryOption: FactoryOption) => Type<NestInterceptor>;
    uriParameter: (crudOptions: CrudOptions, primaryKeys?: PrimaryKey[]) => { path: string; params: string[] };
    swagger: {
        operationMetadata: (tableName: string) => { summary: string; description: string };
        responseMetadata: (opts: { entity: typeof BaseEntity; tableName: string; paginationType: PaginationType }) => {
            [key in HttpStatus]?: { description: string; type?: typeof BaseEntity; schema?: unknown };
        };
    };
    default?: Record<string, unknown>;
}
/**
 * Method별 기본 정책
 */
export const CRUD_POLICY: Record<Method, CrudMethodPolicy> = {
    [Method.READ_ONE]: {
        method: RequestMethod.GET,
        response: CrudResponseOption.ENTITY,
        useBody: false,
        interceptor: (crudOptions: CrudOptions, factoryOption: FactoryOption) => ReadOneRequestInterceptor(crudOptions, factoryOption),
        uriParameter: (crudOptions: CrudOptions, primaryKeys?: PrimaryKey[]) => {
            const params = primaryKeys ? primaryKeys.map(({ name }) => name) : crudOptions.routes?.[Method.READ_ONE]?.params ?? ['id'];
            return { path: params.map((param) => `/:${param}`).join(''), params };
        },
        swagger: {
            operationMetadata: (tableName: string) => ({
                summary: `Read one from '${capitalizeFirstLetter(tableName)}' Table`,
                description: `Fetch one entity in '${capitalizeFirstLetter(tableName)}' Table`,
            }),
            responseMetadata: ({ entity, tableName }) => ({
                [HttpStatus.OK]: {
                    description: `Fetch one entity from ${capitalizeFirstLetter(tableName)} table`,
                    type: entity,
                },
                [HttpStatus.UNPROCESSABLE_ENTITY]: {
                    description: 'Invalid field',
                },
                [HttpStatus.BAD_REQUEST]: {
                    description: 'Entity that does not exist',
                },
            }),
        },
        default: {
            softDeleted: false,
        },
    },
    [Method.SEARCH]: {
        method: RequestMethod.POST,
        response: CrudResponseOption.ENTITY,
        useBody: true,
        interceptor: (crudOptions: CrudOptions, factoryOption: FactoryOption) => SearchRequestInterceptor(crudOptions, factoryOption),
        uriParameter: () => ({
            path: '/search',
            params: [],
        }),
        swagger: {
            operationMetadata: (tableName: string) => ({
                summary: `Search from '${capitalizeFirstLetter(tableName)}' Table`,
                description: `Fetch multiple entities in '${capitalizeFirstLetter(tableName)}' Table via custom query in body`,
            }),
            responseMetadata: ({ entity, tableName }) => ({
                [HttpStatus.OK]: {
                    description: `Fetch multiple entities from '${capitalizeFirstLetter(tableName)}' table`,
                    schema: {
                        type: 'object',
                        properties: {
                            data: {
                                type: 'array',
                                items: {
                                    $ref: `#/components/schemas/${entity.name}`,
                                },
                            },
                        },
                    },
                },
                [HttpStatus.UNPROCESSABLE_ENTITY]: {
                    description: 'Invalid query',
                },
            }),
        },
        default: {
            numberOfTake: 20,
            softDeleted: false,
        },
    },
    [Method.READ_MANY]: {
        method: RequestMethod.GET,
        response: CrudResponseOption.ENTITY,
        useBody: false,
        interceptor: (crudOptions: CrudOptions, factoryOption: FactoryOption) => ReadManyRequestInterceptor(crudOptions, factoryOption),
        uriParameter: () => ({
            path: '/',
            params: [],
        }),
        swagger: {
            operationMetadata: (tableName: string) => ({
                summary: `read many from '${capitalizeFirstLetter(tableName)}' Table`,
                description: `Fetch multiple entities in '${capitalizeFirstLetter(tableName)}' Table`,
            }),
            responseMetadata: ({ entity, tableName, paginationType }) => {
                const metaProperties =
                    paginationType === PaginationType.OFFSET
                        ? {
                              page: { type: 'number', example: 1 },
                              pages: { type: 'number', example: 1 },
                              total: { type: 'number', example: 100 },
                              offset: { type: 'number', example: 20 },
                              query: { type: 'string', example: 'queryToken' },
                          }
                        : {
                              limit: { type: 'number', example: 20 },
                              query: { type: 'string', example: 'queryToken' },
                              nextCursor: { type: 'string', example: 'cursorToken' },
                          };
                return {
                    [HttpStatus.OK]: {
                        description: `Fetch many entities from ${capitalizeFirstLetter(tableName)} table`,
                        schema: {
                            allOf: [
                                {
                                    properties: {
                                        data: {
                                            type: 'array',
                                            items: {
                                                $ref: `#/components/schemas/${entity.name}`,
                                            },
                                        },
                                        metadata: {
                                            type: 'object',
                                            properties: metaProperties,
                                        },
                                    },
                                },
                            ],
                        },
                    },
                    [HttpStatus.UNPROCESSABLE_ENTITY]: {
                        description: 'Invalid query',
                    },
                };
            },
        },
        default: {
            paginationType: PaginationType.CURSOR,
            numberOfTake: 20,
            sort: Sort.DESC,
            softDeleted: false,
        },
    },
    [Method.CREATE]: {
        method: RequestMethod.POST,
        response: CrudResponseOption.ENTITY,
        useBody: true,
        interceptor: (crudOptions: CrudOptions, factoryOption: FactoryOption) => CreateRequestInterceptor(crudOptions, factoryOption),
        uriParameter: () => ({
            path: '/',
            params: [],
        }),
        swagger: {
            operationMetadata: (tableName: string) => ({
                summary: `create one to '${capitalizeFirstLetter(tableName)}' Table`,
                description: `Create an entity in '${capitalizeFirstLetter(tableName)}' Table`,
            }),
            responseMetadata: () => ({
                [HttpStatus.CREATED]: {
                    description: 'Created ok',
                },
                [HttpStatus.CONFLICT]: {
                    description: 'Cannot create',
                },
                [HttpStatus.UNPROCESSABLE_ENTITY]: {
                    description: 'Invalid field',
                },
            }),
        },
    },
    [Method.UPSERT]: {
        method: RequestMethod.PUT,
        response: CrudResponseOption.ENTITY,
        useBody: true,
        interceptor: (crudOptions: CrudOptions, factoryOption: FactoryOption) => UpsertRequestInterceptor(crudOptions, factoryOption),
        uriParameter: (crudOptions: CrudOptions, primaryKeys?: PrimaryKey[]) => {
            const params = primaryKeys ? primaryKeys.map(({ name }) => name) : crudOptions.routes?.[Method.UPSERT]?.params ?? ['id'];
            return { path: params.map((param) => `/:${param}`).join(''), params };
        },
        swagger: {
            operationMetadata: (tableName: string) => ({
                summary: `upsert one to '${capitalizeFirstLetter(tableName)}' Table`,
                description: `Create or update one entity in '${capitalizeFirstLetter(tableName)}' Table`,
            }),
            responseMetadata: () => ({
                [HttpStatus.OK]: { description: 'Upsert ok' },
                [HttpStatus.UNPROCESSABLE_ENTITY]: {
                    description: 'Invalid field',
                },
                [HttpStatus.CONFLICT]: {
                    description: 'Invalid params or if deleted',
                },
            }),
        },
    },
    [Method.UPDATE]: {
        method: RequestMethod.PATCH,
        response: CrudResponseOption.NONE,
        useBody: true,
        interceptor: (crudOptions: CrudOptions, factoryOption: FactoryOption) => UpdateRequestInterceptor(crudOptions, factoryOption),
        uriParameter: (crudOptions: CrudOptions, primaryKeys?: PrimaryKey[]) => {
            const params = primaryKeys ? primaryKeys.map(({ name }) => name) : crudOptions.routes?.[Method.UPDATE]?.params ?? ['id'];
            return { path: params.map((param) => `/:${param}`).join(''), params };
        },
        swagger: {
            operationMetadata: (tableName: string) => ({
                summary: `update one in '${capitalizeFirstLetter(tableName)}' Table`,
                description: `Update on entity in '${capitalizeFirstLetter(tableName)}' Table`,
            }),
            responseMetadata: () => ({
                [HttpStatus.OK]: {
                    description: 'Updated ok',
                },
                [HttpStatus.NOT_FOUND]: {
                    description: 'Not found entity',
                },
                [HttpStatus.UNPROCESSABLE_ENTITY]: {
                    description: 'Invalid field',
                },
            }),
        },
    },
    [Method.DELETE]: {
        method: RequestMethod.DELETE,
        response: CrudResponseOption.NONE,
        useBody: false,
        interceptor: (crudOptions: CrudOptions, factoryOption: FactoryOption) => DeleteRequestInterceptor(crudOptions, factoryOption),
        uriParameter: (crudOptions: CrudOptions, primaryKeys?: PrimaryKey[]) => {
            const params =
                Array.isArray(primaryKeys) && primaryKeys.length > 0
                    ? primaryKeys.map(({ name }) => name)
                    : crudOptions.routes?.[Method.DELETE]?.params ?? ['id'];
            return { path: params.map((param) => `/:${param}`).join(''), params };
        },
        swagger: {
            operationMetadata: (tableName: string) => ({
                summary: `delete one from '${capitalizeFirstLetter(tableName)}' Table`,
                description: `Delete one entity from '${capitalizeFirstLetter(tableName)}' Table`,
            }),
            responseMetadata: () => ({
                [HttpStatus.OK]: {
                    description: 'Deleted ok',
                },
                [HttpStatus.NOT_FOUND]: {
                    description: 'Not found entity',
                },
                [HttpStatus.CONFLICT]: {
                    description: 'Cannot found primary key from entity',
                },
            }),
        },
        default: {
            softDeleted: true,
        },
    },
    [Method.RECOVER]: {
        method: RequestMethod.POST,
        response: CrudResponseOption.ENTITY,
        useBody: false,
        interceptor: (crudOptions: CrudOptions, factoryOption: FactoryOption) => RecoverRequestInterceptor(crudOptions, factoryOption),
        uriParameter: (crudOptions: CrudOptions, primaryKeys?: PrimaryKey[]) => {
            const params = primaryKeys ? primaryKeys.map(({ name }) => name) : crudOptions.routes?.[Method.DELETE]?.params ?? ['id'];
            return {
                path: params
                    .map((param) => `/:${param}`)
                    .join('')
                    .concat('/recover'),
                params,
            };
        },
        swagger: {
            operationMetadata: (tableName: string) => ({
                summary: `recover one from '${capitalizeFirstLetter(tableName)}' Table`,
                description: `Recover one entity from '${capitalizeFirstLetter(tableName)}' Table`,
            }),
            responseMetadata: () => ({
                [HttpStatus.CREATED]: {
                    description: 'Recovered ok',
                },
                [HttpStatus.NOT_FOUND]: {
                    description: 'Not found entity',
                },
            }),
        },
    },
};
