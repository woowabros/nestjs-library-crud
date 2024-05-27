import { Logger } from '@nestjs/common';

import type { Request } from 'express';

export class CrudLogger {
    constructor(private readonly enabled: boolean = false) {}

    log(message: unknown, context?: string): void {
        if (!this.enabled) {
            return;
        }
        Logger.debug(message, ['CRUD', context].filter(Boolean).join(' '));
    }

    logRequest(req: Request | Record<string, unknown>, routeArg: unknown): void {
        this.log(routeArg, `${req.method} ${req.url}`);
    }
}
