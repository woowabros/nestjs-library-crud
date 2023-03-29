import { Logger } from '@nestjs/common';
import { Request } from 'express';

export class CrudLogger {
    constructor(private readonly enabled: boolean = false) {}

    log(message: any, context?: string) {
        if (!this.enabled) {
            return;
        }
        Logger.debug(message, ['CRUD', context].filter(Boolean).join(' '));
    }

    logRequest(req: Request | Record<string, unknown>, routeArg: unknown) {
        this.log(routeArg, `${req.method} ${req.url}`);
    }
}
