# @nestjs-library/crud

<p align="center">
    <img src="https://github.com/woowabros/nestjs-library-crud/actions/workflows/ci.yml/badge.svg" alt="Node.js CI">
    <a href='https://coveralls.io/github/woowabros/nestjs-library-crud?branch=main'>
        <img src='https://coveralls.io/repos/github/woowabros/nestjs-library-crud/badge.svg?branch=main' alt='Coverage Status' />
    </a>
    <a href="https://www.npmjs.com/package/@nestjs-library/crud">
        <img src="https://img.shields.io/npm/v/@nestjs-library/crud">
    </a>
    <a href="https://www.npmjs.com/package/@nestjs-library/crud">
        <img src="https://img.shields.io/bundlephobia/minzip/@nestjs-library/crud">
    </a>
    <a href="https://www.npmjs.com/package/@nestjs-library/crud">
        <img src="https://img.shields.io/npm/dw/@nestjs-library/crud">
    </a>        
</p>

<p align="center">
    <a href="./README.md">
        <span>English<span>
    </a> 
    <span>|</span>
    <a href="./README.ko.md">
        <span>한국어<span>
    </a> 
</p>

This is a Typescript library that provides a NestJS decorator which automatically generates CRUD routes of a controller for given TypeORM entity. The decorator generates endpoints for not only create, retrieve one, retrieve many, update, delete but also upsert, recover and search operations for the entity.

## Features

-   Automatically generates CRUD routes for a given TypeORM entity
-   Automatically generates swagger for generated routes
-   Supports pagination, sorting, filtering, relation, searching, upserting, recovering and soft deleting
-   Supports complex search criteria(`LIKE`, `ILIKE`, `BETWEEN`, `IN`, `NULL`, `?`, `@>`, `JSON_CONTAINS`)
-   Supports strong validation by using [class-validator](https://github.com/typestack/class-validator)
-   Supports saving author information for mutating operations(Create, Update, Upsert, Delete and Recover)
-   Supports adding decorators, interceptors to each routes in Controller for customizing
-   Supports customizing swagger response

## Installation

```bash
# npm
npm install @nestjs-library/crud

# yarn
yarn add @nestjs-library/crud

# pnpm
pnpm add @nestjs-library/crud
```

## Usage

### Step 1: Define a TypeORM entity

In order to use the Crud decorator, you need to define a TypeORM entity first. The following example defines a User entity with the following properties.

```typescript
import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    username: string;

    @Column()
    email: string;
}
```

### Step 2: Create Service and Controller

Create a NestJS service and controller with a TypeORM entity. The service needs to extend the CrudService class and the controller needs to implement the CrudController interface.

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudService } from '@nestjs-library/crud';
import { Repository } from 'typeorm';

import { User } from './user.entity';

@Injectable()
export class UserService extends CrudService<User> {
    constructor(@InjectRepository(User) repository: Repository<User>) {
        super(repository);
    }
}
```

```typescript
import { Controller } from '@nestjs/common';
import { Crud, CrudController } from '@nestjs-library/crud';

import { User } from './user.entity';
import { UserService } from './user.service';

@Crud({ entity: User })
@Controller('users')
export class UserController implements CrudController<User> {
    constructor(public readonly crudService: UserService) {}
}
```

### Step 3: Add Service, Controller and TypeORM module to your module

In your NestJS module, add Service, Controller and TypeORM module to providers, controllers, imports array respectively.

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    controllers: [UserController],
    providers: [UserService],
})
export class UserModule {}
```

### Step 4: Access the generated endpoints

After the module initializes, it will generate the following CRUD endpoints:

-   `GET /users` - retrieves a list of users with pagination
-   `GET /users/:id` - retrieves a single user by ID
-   `POST /users` - creates single or multiple users
-   `PATCH /users/:id` - updates an existing user by ID
-   `DELETE /users/:id` - deletes an existing user by ID
-   `PUT /users/:id` - upserts (update or create) an existing user by ID
-   `POST /users/search` - retrieves a list of users based on complex search criteria
-   `POST /users/:id/recover` - recovers a soft deleted user by ID

## Configuration

The Crud decorator supports the following configuration options:

### entity

(required) The TypeORM entity that the controller operates on.

### routes

(optional) You can configure each route by specifying the routes option.

For example, if you want to set the default pagination size for a search route, you can specify option as below.

```typescript
@Crud({
    entity: User,
    routes: {
        search: { numberOfTake: 5 },
    },
})
```

Every route has the following base options.

```typescript
import { NestInterceptor, Type } from '@nestjs/common';

interface RouteBaseOption {
    decorators?: Array<PropertyDecorator | MethodDecorator>;
    interceptors?: Array<Type<NestInterceptor>>;
    swagger?: {
        hide?: boolean;
        response?: Type<unknown>;
    };
    exclude?: string[];
}
```

`CREATE`, `UPDATE`, `DELETE`, `UPSERT`, and `RECOVER` routes can have the following options.

```typescript
interface SaveOptions {
    listeners?: boolean;
}
```

And each route has its own options as below.

#### `READ_ONE`

```typescript
interface ReadOneOptions {
    params?: string[];
    softDelete?: boolean;
    relations?: false | string[];
}
```

#### `READ_MANY`

```typescript
import { Sort, PaginationType } from 'src/lib/interface';

interface ReadManyOptions {
    sort?: Sort | `${Sort}`;
    paginationType?: PaginationType | `${PaginationType}`;
    numberOfTake?: number;
    relations?: false | string[];
    softDelete?: boolean;
    paginationKeys?: string[];
}
```

#### `SEARCH`

```typescript
import { PaginationType } from 'src/lib/interface';

interface SearchOptions {
    paginationType?: PaginationType | `${PaginationType}`;
    numberOfTake?: number;
    limitOfTake?: number;
    relations?: false | string[];
    softDelete?: boolean;
    paginationKeys?: string[];
}
```

#### `CREATE`

```typescript
import { Type } from '@nestjs/common';
import { Author } from 'src/lib/interface';

interface CreateOptions {
    swagger?: {
        body?: Type<unknown>;
    };
    author?: Author;
}
```

#### `UPDATE`

```typescript
import { Type } from '@nestjs/common';
import { Author } from 'src/lib/interface';

interface UpdateOptions {
    params?: string[];
    swagger?: {
        body?: Type<unknown>;
    };
    author?: Author;
}
```

#### `DELETE`

```typescript
import { Author } from 'src/lib/interface';

interface DeleteOptions {
    params?: string[];
    softDelete?: boolean;
    author?: Author;
}
```

#### `UPSERT`

```typescript
interface UpsertOptions {
    params?: string[];
    swagger?: {
        body?: Type<unknown>;
    };
    author?: Author;
}
```

#### `RECOVER`

```typescript
interface RecoverOptions {
    params?: string[];
    author?: Author;
}
```

### only

(optional) An array of methods to generate routes for. If not specified, all routes will be generated.

For example, if you want to generate only create and retrieve one, you can specify the following configuration.

```typescript
import { Crud, Method } from '@nestjs-library/crud';

@Crud({ entity: User, only: [Method.CREATE,  Method.READ_ONE] })
```

## [Contributors](https://github.com/woowabros/nestjs-library-crud/graphs/contributors)

![Contributors](https://contrib.rocks/image?repo=woowabros/nestjs-library-crud)

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=woowabros/nestjs-library-crud&type=Date)](https://star-history.com/#woowabros/nestjs-library-crud&Date)

## License

This library is licensed under the MIT License. See the [LICENSE](./LICENSE.md) file for details.
