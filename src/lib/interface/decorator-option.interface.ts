import { NestInterceptor, Type } from '@nestjs/common';
import { BaseEntity, ColumnType } from 'typeorm';

import { Method, Sort, PaginationType, Author } from '.';

interface RouteBaseOption {
    /**
     * An array of decorators to apply to the route handler
     */
    decorators?: Array<PropertyDecorator | MethodDecorator>;
    /**
     * An array of interceptors to apply to the route handler
     */
    interceptors?: Array<Type<NestInterceptor>>;
    /**
     * Configures the Swagger documentation for the route
     */
    swagger?: {
        /**
         * If set to true, the route will not be included in the Swagger documentation
         */
        hide?: boolean;
        /**
         * Configures the Swagger documentation for the route's response
         */
        response?: Type<unknown>;
    };
}

export interface PrimaryKey {
    name: string;
    type?: ColumnType;
}

export interface CrudOptions {
    /**
     * Entity class which CRUD operations will be performed
     */
    entity: typeof BaseEntity;

    /**
     * enable Debug logging, default is false
     */
    logging?: boolean;

    /**
     * Configures each CRUD method
     */
    routes?: {
        [Method.READ_ONE]?: {
            /**
             * Array of path parameters to use for the route
             *
             * @example
             * ```ts
             * params: ['id', 'subId']
             * ```
             * It will generate the route `/:id/:subId`
             */
            params?: string[];
            /**
             * If set to true, soft-deleted enitity could be included in the result.
             */
            softDelete?: boolean;
            relations?: false | string[];
        } & RouteBaseOption;
        [Method.READ_MANY]?: {
            /**
             * Way to order the result
             */
            sort?: Sort | `${Sort}`;
            /**
             * Type of pagination to use. Currently 'offset' and 'cursor' are supported.
             */
            paginationType?: PaginationType | `${PaginationType}`;
            /**
             * Max number of entities should be taken.
             */
            numberOfTake?: number;
            /**
             * What relations of entity should be loaded.
             * If set to false or an empty array, no relations will be loaded.
             */
            relations?: false | string[];
            /**
             * If set to true, soft-deleted enitity could be included in the result.
             */
            softDelete?: boolean;
        } & Omit<RouteBaseOption, 'response'>;
        [Method.SEARCH]?: {
            /**
             * Default number of entities should be taken.
             */
            numberOfTake?: number;
            /**
             * Max number of entities should be taken.
             */
            limitOfTake?: number;
            /**
             * What relations of entity should be loaded.
             * If set to false or an empty array, no relations will be loaded.
             */
            relations?: false | string[];
            /**
             * If set to true, soft-deleted enitity could be included in the result.
             */
            softDelete?: boolean;
        } & RouteBaseOption;
        [Method.CREATE]?: {
            swagger?: {
                /**
                 * Configures the Swagger documentation for the route's request body
                 */
                body?: Type<unknown>;
            };
            /**
             * Configures ways to save author information to the Entity after the operation completed.
             * It updates Entity's author.property field with author.filter's value from express's Request object.
             * If author.filter is not found in the Request object, author.value will be used as default.
             */
            author?: Author;
        } & RouteBaseOption;
        [Method.UPDATE]?: {
            /**
             * Array of path parameters to use for the route
             *
             * @example
             * ```ts
             * params: ['id', 'subId']
             * ```
             * It will generate the route `/:id/:subId`.
             */
            params?: string[];
            swagger?: {
                /**
                 * Configures the Swagger documentation for the route's request body
                 */
                body?: Type<unknown>;
            };
            /**
             * Configures ways to save author information to the Entity after the operation completed.
             *
             * It updates Entity's author.property field with author.filter's value from express's Request object.
             * If author.filter is not found in the Request object, author.value will be used as default.
             */
            author?: Author;
        } & RouteBaseOption;
        [Method.DELETE]?: {
            /**
             * Array of path parameters to use for the route
             *
             * @example
             * ```ts
             * params: ['id', 'subId']
             * ```
             * It will generate the route `/:id/:subId`
             */
            params?: string[];
            /**
             * If set to true, the enitity will be soft deleted. (Records the delete date of the entity)
             */
            softDelete?: boolean;
            /**
             * Configures ways to save author information to the Entity after the operation completed.
             *
             * It updates Entity's author.property field with author.filter's value from express's Request object.
             * If author.filter is not found in the Request object, author.value will be used as default.
             */
            author?: Author;
        } & RouteBaseOption;
        [Method.UPSERT]?: {
            /**
             * Array of path parameters to use for the route
             *
             * @example
             * ```ts
             * params: ['id', 'subId']
             * ```
             * It will generate the route `/:id/:subId`
             */
            params?: string[];
            swagger?: {
                /**
                 * Configures the Swagger documentation for the route's request body
                 */
                body?: Type<unknown>;
            };
            /**
             * Configures ways to save author information to the Entity after the operation completed.
             *
             * It updates Entity's author.property field with author.filter's value from express's Request object.
             * If author.filter is not found in the Request object, author.value will be used as default.
             */
            author?: Author;
        } & RouteBaseOption;
        [Method.RECOVER]?: {
            /**
             * Array of path parameters to use for the route
             *
             * @example
             * ```ts
             * params: ['id', 'subId']
             * ```
             * It will generate the route `/:id/:subId`
             */
            params?: string[];
            /**
             * Configures ways to save author information to the Entity after the operation completed.
             *
             * It updates Entity's author.property field with author.filter's value from express's Request object.
             * If author.filter is not found in the Request object, author.value will be used as default.
             */
            author?: Author;
        } & RouteBaseOption;
    };
    /**
     * An array of methods to generate routes for. If not specified, all routes will be generated.
     */
    only?: Array<Method | `${Method}`>;
}
