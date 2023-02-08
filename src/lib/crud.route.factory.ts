/* eslint-disable @typescript-eslint/ban-types */
import { ExecutionContext, HttpStatus } from '@nestjs/common';
import {
    INTERCEPTORS_METADATA,
    CUSTOM_ROUTE_ARGS_METADATA,
    PATH_METADATA,
    METHOD_METADATA,
    ROUTE_ARGS_METADATA,
    PARAMTYPES_METADATA,
    HTTP_CODE_METADATA,
} from '@nestjs/common/constants';
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { BaseEntity, getMetadataArgsStorage } from 'typeorm';
import { MetadataUtils } from 'typeorm/metadata-builder/MetadataUtils';

import { Constants } from './constants';
import { CRUD_POLICY } from './crud.policy';
import { CreateRequestDto } from './dto/request.dto';
import {
    CrudOptions,
    Method,
    CrudReadManyRequest,
    CrudReadOneRequest,
    CrudSearchRequest,
    CrudUpdateOneRequest,
    CrudCreateRequest,
    CrudDeleteOneRequest,
    PrimaryKey,
    Column,
    CrudRecoverRequest,
    PaginationType,
    PAGINATION_QUERY,
    FactoryOption,
} from './interface';
import { capitalizeFirstLetter, isSomeEnum } from './util';

export class CrudRouteFactory {
    private entity: {
        tableName: string;
        primaryKeys?: PrimaryKey[];
        columns?: Column[];
    } = {
        tableName: '',
    };
    private overrideMap: Map<string, string>;
    private paginationType: PaginationType;

    constructor(protected target: any, protected crudOptions: CrudOptions) {
        this.entityInformation(crudOptions.entity);

        const paginationType = this.crudOptions.routes?.readMany?.paginationType ?? CRUD_POLICY[Method.READ_MANY].default?.paginationType;
        const isPaginationType = isSomeEnum(PaginationType);
        if (!isPaginationType(paginationType)) {
            throw new TypeError(`invalid PaginationType ${paginationType}`);
        }
        this.paginationType = paginationType;

        this.overrideMap = this.getOverrideMap();
    }

    public init() {
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
            isPrimary: !!options.primary,
        }));

        this.entity.columns = entityColumns;
        const primaryKeys = entityColumns.filter(({ isPrimary }) => isPrimary);

        if (!(primaryKeys.length === 1 && primaryKeys[0].name === 'id')) {
            this.entity.primaryKeys = primaryKeys;
        }
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
        this.targetPrototype[controllerMethodName] = function reservedSearch(crudSearchRequest: CrudSearchRequest<T>) {
            return this.crudService.reservedSearch(crudSearchRequest);
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
            const enableRecover = this.crudOptions.routes?.[Method.DELETE]?.softDelete ?? CRUD_POLICY[Method.DELETE].default?.softDeleted;
            if (!enableRecover) {
                return;
            }
        }

        const isOverride = this.overrideMap.has(crudMethod);
        const methodName = isOverride ? this.overrideMap.get(crudMethod) : this.writeMethodOnController(crudMethod);
        if (!methodName) {
            throw new Error(`Required Method Name of ${crudMethod}`);
        }

        const targetMethod = this.targetPrototype[methodName];
        const { path, params } = CRUD_POLICY[crudMethod].uriParameter(this.crudOptions, this.entity.primaryKeys);
        const methodNameOnController = this.controllerMethodName(crudMethod);
        const factoryOption: FactoryOption = {
            columns: this.entity.columns,
            primaryKeys: this.entity.primaryKeys ?? [{ name: 'id', type: 'number' }],
        };

        Reflect.defineMetadata(
            INTERCEPTORS_METADATA,
            [
                ...(this.crudOptions.routes?.[crudMethod]?.interceptors ?? []),
                isOverride ? undefined : CRUD_POLICY[crudMethod].interceptor(this.crudOptions, factoryOption),
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
        if (this.crudOptions.routes?.[method]?.swagger === false) {
            Reflect.defineMetadata(DECORATORS.API_EXCLUDE_ENDPOINT, { disable: true }, target);
            return;
        }

        Reflect.defineMetadata(DECORATORS.API_OPERATION, CRUD_POLICY[method].swagger.operationMetadata(this.tableName), target);
        this.defineParameterSwagger(method, params, target);

        Reflect.defineMetadata(
            DECORATORS.API_RESPONSE,
            CRUD_POLICY[method].swagger.responseMetadata({
                entity: this.crudOptions.entity,
                tableName: this.tableName,
                paginationType: this.paginationType,
            }),
            target,
        );
    }

    private defineParameterSwagger(method: Method, params: string[], target: Object) {
        const parameterDecorators: Array<{
            name?: string;
            description?: string;
            required: boolean;
            in: string;
            items?: { type: string };
            type: unknown;
            isArray?: boolean;
        }> = params.map((param) => ({ name: param, required: true, in: 'path', type: String, isArray: false }));

        if (method === Method.READ_MANY) {
            parameterDecorators.push(
                ...PAGINATION_QUERY[this.paginationType].map(({ name, type }) => ({
                    name,
                    type,
                    in: 'query',
                    required: false,
                    description: `Query parameters for ${capitalizeFirstLetter(this.paginationType)} Pagination`,
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
            parameterDecorators.push({
                description: [capitalizeFirstLetter(method), capitalizeFirstLetter(this.tableName), 'Dto'].join(''),
                required: true,
                in: 'body',
                type: CreateRequestDto(this.crudOptions.entity, method),
                isArray: false,
            });
        }
        Reflect.defineMetadata(DECORATORS.API_PARAMETERS, parameterDecorators, target);
    }

    private getOverrideMap(): Map<string, string> {
        const overrideMap = new Map<string, string>();

        for (const name of Object.getOwnPropertyNames(this.targetPrototype)) {
            const overrodeCrudMethodName: keyof typeof Method = Reflect.getMetadata(
                Constants.OVERRIDE_METHOD_METADATA,
                this.targetPrototype[name],
            );
            if (!overrodeCrudMethodName) {
                continue;
            }
            if (overrideMap.has(overrodeCrudMethodName)) {
                throw new Error(`duplicated ${overrodeCrudMethodName} method on ${name}`);
            }
            overrideMap.set(overrodeCrudMethodName, name);
        }

        return overrideMap;
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
            [`${Constants.CRUD_ROUTE_ARGS}${CUSTOM_ROUTE_ARGS_METADATA}:${index}`]: {
                index,
                factory: (_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest()[Constants.CRUD_ROUTE_ARGS],
                data,
                pipes,
            },
        };
    }
}
