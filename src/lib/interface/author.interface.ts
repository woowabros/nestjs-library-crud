export interface Author {
    /**
     * The name of property(field) to be updated after the operation completed.
     * For example, 'createdBy', 'updatedBy', 'lastModifiedBy', 'deletedBy' etc.
     */
    property: string;
    /**
     * Name of property to access from express's Request object
     *
     * @example
     * Assume that authentication layer validates requests and attaches a user entity to the request object
     *
     * ```typescript
     * {
     *  "id": 101,
     *  "username": "Donghyuk",
     *  "email": "donghyuk@email.com",
     * }
     * ```
     *
     * Then, you can use 'user' as a filter to access the user object from the Request
     * ```typescript
     * {
     *  "filter": "user",
     * }
     * ```
     */
    filter?: string;
    /**
     * Default value to use if filter is not found in express's Request object
     */
    value?: unknown;
}
