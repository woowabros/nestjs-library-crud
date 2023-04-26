import 'reflect-metadata';

import { OVERRIDE_METHOD_METADATA } from './constants';
import { Override } from './override.decorator';

describe('@Override', () => {
    it('should mark the method has been overridden', () => {
        class Test {
            @Override('READ_ONE')
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            static testMethod() {}
        }

        const metadata = Reflect.getMetadata(OVERRIDE_METHOD_METADATA, Test.testMethod);
        expect(metadata).toBe('READ_ONE');
    });
});
