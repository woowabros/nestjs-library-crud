/* eslint-disable @typescript-eslint/ban-types */
import { ExecutionContext, HttpStatus, Type } from '@nestjs/common';
import {
    CUSTOM_ROUTE_ARGS_METADATA,
    HTTP_CODE_METADATA,
    INTERCEPTORS_METADATA,
    METHOD_METADATA,
    PARAMTYPES_METADATA,
    PATH_METADATA,
    ROUTE_ARGS_METADATA,
} from '@nestjs/common/constants';
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { BaseEntity, getMetadataArgsStorage } from 'typeorm';
import { MetadataUtils } from 'typeorm/metadata-builder/MetadataUtils';

import { capitalizeFirstLetter } from './capitalize-first-letter';
import { CRUD_ROUTE_ARGS } from './constants';
import { CRUD_POLICY } from './crud.policy';
import { RequestSearchDto } from './dto/request-search.dto';
import { CreateRequestDto, getPropertyNamesFromMetadata } from './dto/request.dto';
import {
    Column,
    CrudCreateRequest,
    CrudDeleteOneRequest,
    CrudOptions,
    CrudReadOneRequest,
    CrudRecoverRequest,
    CrudUpdateOneRequest,
    FactoryOption,
    Method,
    PaginationType,
    PAGINATION_SWAGGER_QUERY,
    PrimaryKey,
} from './interface';
import { CrudLogger } from './provider/crud-logger';
import { CrudReadManyRequest } from './request';

type ParameterDecorators =
    | {
          name?: string;
          description?: string;
          required: boolean;
          in: string;
          items?: { type: string };
          type: unknown;
          isArray?: boolean;
      }
    | {
          name?: any;
          description?: string;
          required: boolean;
          in: string;
          type: unknown;
          schema: {
              [type: string]: unknown;
          };
      };

export class CrudRouteFactory {
    private crudLogger: CrudLogger;
    private entity: {
        tableName: string;
        relations?: string[];
        primaryKeys?: PrimaryKey[];
        columns?: Column[];
    } = {
        tableName: '',
    };
    private paginationType: PaginationType;

    constructor(protected target: any, protected crudOptions: CrudOptions) {
        this.entityInformation(crudOptions.entity);

        const paginationType = crudOptions.routes?.readMany?.paginationType ?? CRUD_POLICY[Method.READ_MANY].default.paginationType;
        const isPaginationType = (
            <TEnum extends Record<string, unknown>>(enumType: TEnum) =>
            (nextCursor: unknown): nextCursor is TEnum[keyof TEnum] =>
                Object.values(enumType).includes(nextCursor as TEnum[keyof TEnum])
        )(PaginationType);
        if (!isPaginationType(paginationType)) {
            throw new TypeError(`invalid PaginationType ${paginationType}`);
        }
        this.paginationType = paginationType;
        this.crudLogger = new CrudLogger(crudOptions.logging);
    }

    init() {
        for (const method of Object.values(Method)) {
            if (!this.enabledMethod(method)) {
                continue;
            }
            this.createMethod(method);
        }
    }

    private entityInformation(entity: typeof BaseEntity) {
        const tableName = getMetadataArgsStorage().tables.find(({ target }) => target === entity)?.name;
        if (!tableName) {
            throw new Error('Cannot find Entity name from TypeORM');
        }
        this.entity.tableName = tableName;

        const inheritanceTree = MetadataUtils.getInheritanceTree(entity);
        const columnList = getMetadataArgsStorage().columns.filter(({ target }) => inheritanceTree.includes(target as Function));
        const entityColumns = columnList.map(({ propertyName, options }) => ({
            name: propertyName,
            type: options.type,
            isPrimary: Boolean(options.primary),
        }));

        this.entity.columns = entityColumns;

        const primaryKeys = entityColumns.filter(({ isPrimary }) => isPrimary);
        if (!(primaryKeys.length === 1 && primaryKeys[0].name === 'id')) {
            this.entity.primaryKeys = primaryKeys;
        }

        this.entity.relations = getMetadataArgsStorage().relations.flatMap(({ target, propertyName }) =>
            inheritanceTree.includes(target as Function) ? [propertyName] : [],
        );
    }

    protected get tableName(): string {
        return this.entity.tableName;
    }

    protected get targetPrototype() {
        return this.target.prototype;
    }

    protected readOne<T>(controllerMethodName: string) {
        this.targetPrototype[controllerMethodName] = function reservedReadOne(crudReadOneRequest: CrudReadOneRequest<T>) {
            return this.crudService.reservedReadOne(crudReadOneRequest);
        };
    }

    protected readMany<T>(controllerMethodName: string) {
        this.targetPrototype[controllerMethodName] = function reservedReadMany(crudReadManyRequest: CrudReadManyRequest<T>) {
            return this.crudService.reservedReadMany(crudReadManyRequest);
        };
    }

    protected search<T>(controllerMethodName: string) {
        this.targetPrototype[controllerMethodName] = function reservedSearch(crudReadManyRequest: CrudReadManyRequest<T>) {
            return this.crudService.reservedReadMany(crudReadManyRequest);
        };
    }

    protected create<T>(controllerMethodName: string) {
        this.targetPrototype[controllerMethodName] = function reservedCreate(crudCreateRequest: CrudCreateRequest<T>) {
            return this.crudService.reservedCreate(crudCreateRequest);
        };
    }

    protected upsert<T>(controllerMethodName: string) {
        this.targetPrototype[controllerMethodName] = function reservedUpsert(crudCreateRequest: CrudCreateRequest<T>) {
            return this.crudService.reservedUpsert(crudCreateRequest);
        };
    }

    protected update<T>(controllerMethodName: string) {
        this.targetPrototype[controllerMethodName] = function reservedUpdate(crudUpdateOneRequest: CrudUpdateOneRequest<T>) {
            return this.crudService.reservedUpdate(crudUpdateOneRequest);
        };
    }

    protected delete<T>(controllerMethodName: string) {
        this.targetPrototype[controllerMethodName] = function reservedDelete(crudDeleteOneRequest: CrudDeleteOneRequest<T>) {
            return this.crudService.reservedDelete(crudDeleteOneRequest);
        };
    }

    protected recover<T>(controllerMethodName: string) {
        this.targetPrototype[controllerMethodName] = function reservedRecover(crudRecoverRequest: CrudRecoverRequest<T>) {
            return this.crudService.reservedRecover(crudRecoverRequest);
        };
    }

    private createMethod(crudMethod: Method): void {
        if (crudMethod === Method.RECOVER) {
            const enableRecover = this.crudOptions.routes?.[Method.DELETE]?.softDelete ?? CRUD_POLICY[Method.DELETE].default.softDeleted;
            if (!enableRecover) {
                return;
            }
        }

        const methodName = this.writeMethodOnController(crudMethod);
        if (!methodName) {
            throw new Error(`Required Method Name of ${crudMethod}`);
        }

        const targetMethod = this.targetPrototype[methodName];
        const { path, params } = CRUD_POLICY[crudMethod].uriParameter(this.crudOptions, this.entity.primaryKeys);
        const methodNameOnController = this.controllerMethodName(crudMethod);
        const factoryOption: FactoryOption = {
            columns: this.entity.columns,
            relations: this.entity.relations ?? [],
            primaryKeys: this.entity.primaryKeys ?? [{ name: 'id', type: 'number' }],
            logger: this.crudLogger,
        };

        Reflect.defineMetadata(
            INTERCEPTORS_METADATA,
            [
                ...(this.crudOptions.routes?.[crudMethod]?.interceptors ?? []),
                CRUD_POLICY[crudMethod].interceptor(this.crudOptions, factoryOption),
            ].filter(Boolean),
            targetMethod,
        );

        this.applySwaggerDecorator(crudMethod, params, targetMethod);

        const requestArg = this.createCrudRouteArg();
        Reflect.defineMetadata(ROUTE_ARGS_METADATA, requestArg, this.target, methodNameOnController);
        Reflect.defineMetadata(PARAMTYPES_METADATA, [Object], this.targetPrototype, methodNameOnController);

        if (crudMethod === Method.SEARCH) {
            Reflect.defineMetadata(HTTP_CODE_METADATA, HttpStatus.OK, targetMethod);
        }

        const customDecorators = this.crudOptions.routes?.[crudMethod]?.decorators ?? [];

        if (customDecorators.length > 0) {
            for (const decorator of customDecorators) {
                const descriptor = Reflect.getOwnPropertyDescriptor(targetMethod, methodNameOnController);
                (decorator as MethodDecorator | PropertyDecorator)(
                    targetMethod,
                    methodNameOnController,
                    descriptor ?? { value: targetMethod },
                );
            }
        }

        Reflect.defineMetadata(PATH_METADATA, path, targetMethod);
        Reflect.defineMetadata(METHOD_METADATA, CRUD_POLICY[crudMethod].method, targetMethod);
    }

    private applySwaggerDecorator(method: Method, params: string[], target: Object) {
        if (this.crudOptions.routes?.[method]?.swagger?.hide) {
            Reflect.defineMetadata(DECORATORS.API_EXCLUDE_ENDPOINT, { disable: true }, target);
            return;
        }

        Reflect.defineMetadata(DECORATORS.API_OPERATION, CRUD_POLICY[method].swagger.operationMetadata(this.tableName), target);
        this.defineParameterSwagger(method, params, target);

        if (this.crudOptions.routes?.[method]?.swagger?.response) {
            const responseDto = this.generalTypeGuard(this.crudOptions.routes?.[method]?.swagger?.response!, method, 'response');
            const extraModels: Array<{ name: string }> = Reflect.getMetadata(DECORATORS.API_EXTRA_MODELS, target) ?? [];
            if (!extraModels.some((model) => model.name === responseDto.name)) {
                Reflect.defineMetadata(DECORATORS.API_EXTRA_MODELS, [...extraModels, responseDto], target);
            }
        }
        const swaggerResponse = this.crudOptions.routes?.[method]?.swagger?.response ?? this.crudOptions.entity;

        Reflect.defineMetadata(
            DECORATORS.API_RESPONSE,
            CRUD_POLICY[method].swagger.responseMetadata({
                type: swaggerResponse,
                tableName: this.tableName,
                paginationType: this.paginationType,
            }),
            target,
        );

        if (method === Method.READ_MANY) {
            const extraModels: Array<{ name: string }> = Reflect.getMetadata(DECORATORS.API_EXTRA_MODELS, target) ?? [];
            Reflect.defineMetadata(DECORATORS.API_EXTRA_MODELS, [...extraModels, swaggerResponse], target);
        }
    }

    private defineParameterSwagger(method: Method, params: string[], target: Object) {
        const parameterDecorators: ParameterDecorators[] = params.map((param) => ({
            name: param,
            required: true,
            in: 'path',
            type: String,
            isArray: false,
        }));

        if (method === Method.READ_MANY) {
            parameterDecorators.push(
                ...PAGINATION_SWAGGER_QUERY[this.paginationType].map(({ name, type }) => ({
                    name,
                    type,
                    in: 'query',
                    required: false,
                    description: `Query parameters for ${capitalizeFirstLetter(this.paginationType)} Pagination`,
                })),
                ...getPropertyNamesFromMetadata(this.crudOptions.entity, method).map((property) => ({
                    name: property,
                    type: 'string',
                    in: 'query',
                    required: false,
                    description: `Query string filter by ${this.crudOptions.entity.name}.${property}`,
                })),
            );
        }
        if (method === Method.READ_ONE) {
            parameterDecorators.push({
                name: 'fields',
                type: 'array',
                in: 'query',
                items: {
                    type: 'string',
                },
                required: false,
                description: 'Pick response fields',
            });
        }
        if (CRUD_POLICY[method].useBody) {
            const bodyType = (() => {
                if (method === Method.SEARCH) {
                    return RequestSearchDto;
                }
                const routeConfig = this.crudOptions.routes?.[method];
                if (routeConfig?.swagger && 'body' in routeConfig.swagger) {
                    return this.generalTypeGuard(routeConfig.swagger['body']!, method, 'body');
                }

                return CreateRequestDto(this.crudOptions.entity, method);
            })();

            parameterDecorators.push(
                method === Method.CREATE
                    ? {
                          description: [capitalizeFirstLetter(method), capitalizeFirstLetter(this.tableName), 'Dto'].join(''),
                          required: true,
                          in: 'body',
                          type: bodyType,
                          schema: {
                              type: 'object',
                              anyOf: [
                                  {
                                      $ref: `#/components/schemas/${bodyType.name}`,
                                  },
                                  { type: 'array', items: { $ref: `#/components/schemas/${bodyType.name}` } },
                              ],
                          },
                      }
                    : {
                          description: [capitalizeFirstLetter(method), capitalizeFirstLetter(this.tableName), 'Dto'].join(''),
                          required: true,
                          in: 'body',
                          type: bodyType,
                          isArray: false,
                      },
            );
        }
        Reflect.defineMetadata(DECORATORS.API_PARAMETERS, parameterDecorators, target);
    }

    private enabledMethod(crudMethod: Method): boolean {
        if (!Array.isArray(this.crudOptions.only) || this.crudOptions.only.length === 0) {
            return true;
        }
        return this.crudOptions.only.includes(crudMethod);
    }

    private controllerMethodName(crudMethod: Method): string {
        return `reserved${capitalizeFirstLetter(crudMethod)}`;
    }

    private writeMethodOnController(crudMethod: Method): string {
        const entity = this.crudOptions.entity;
        const controllerMethodName: string = this.controllerMethodName(crudMethod);

        if (this.targetPrototype[controllerMethodName]) {
            throw new Error(`${controllerMethodName} is a reserved word. cannot use`);
        }
        this[crudMethod]<typeof entity>(controllerMethodName);
        return controllerMethodName;
    }

    private createCrudRouteArg(
        index = 0,
        /* istanbul ignore next */
        pipes: unknown[] = [],
        data = undefined,
    ) {
        return {
            [`${CRUD_ROUTE_ARGS}${CUSTOM_ROUTE_ARGS_METADATA}:${index}`]: {
                index,
                factory: (_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest()[CRUD_ROUTE_ARGS],
                data,
                pipes,
            },
        };
    }

    private generalTypeGuard<T extends Type<unknown>>(type: T, method: Method, postFix?: string): T {
        if (['PickTypeClass', 'OmitTypeClass'].includes(type.name)) {
            Object.defineProperty(type, 'name', {
                value: [
                    capitalizeFirstLetter(method),
                    capitalizeFirstLetter(this.tableName),
                    postFix && capitalizeFirstLetter(postFix),
                    'Dto',
                ].join(''),
            });
        }
        return type;
    }
}
