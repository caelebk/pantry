import '@analogjs/vitest-angular/setup-snapshots';
import '@analogjs/vitest-angular/setup-zone';
import { TestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { expect, vi } from 'vitest';

// Initialize Angular TestBed environment for Vitest
TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

// Add Jasmine-compatible matchers to Vitest expect
expect.extend({
  toBeTrue(received: unknown) {
    return {
      pass: received === true,
      message: () => `expected ${received} to be true`,
    };
  },
  toBeFalse(received: unknown) {
    return {
      pass: received === false,
      message: () => `expected ${received} to be false`,
    };
  },
});

function createSpyFn(impl?: any) {
  const spy = impl ? vi.fn(impl) : vi.fn();
  (spy as any).and = {
    returnValue: (val: any) => {
      spy.mockReturnValue(val);
      return spy;
    },
    returnValues: (...vals: any[]) => {
      vals.forEach((val) => spy.mockReturnValueOnce(val));
      return spy;
    },
    callFake: (fn: any) => {
      spy.mockImplementation(fn);
      return spy;
    },
    exec: (fn: any) => {
      spy.mockImplementation(fn);
      return spy;
    },
    identity: () => spy,
  };
  return spy;
}

// Global Jasmine compatibility adapter for Vitest
(globalThis as any).jasmine = {
  createSpyObj: (
    _baseName: string,
    methodNames: string[] | Record<string, any>,
    propertyNamesOrMap?: string[] | Record<string, any>,
  ) => {
    const obj: any = {};
    if (Array.isArray(methodNames)) {
      methodNames.forEach((method) => {
        obj[method] = createSpyFn();
      });
    } else if (methodNames && typeof methodNames === 'object') {
      Object.keys(methodNames).forEach((key) => {
        obj[key] = createSpyFn(
          typeof methodNames[key] === 'function' ? methodNames[key] : () => methodNames[key],
        );
      });
    }

    if (Array.isArray(propertyNamesOrMap)) {
      propertyNamesOrMap.forEach((prop) => {
        obj[prop] = createSpyFn();
      });
    } else if (propertyNamesOrMap && typeof propertyNamesOrMap === 'object') {
      Object.keys(propertyNamesOrMap).forEach((key) => {
        const val = propertyNamesOrMap[key];
        if (typeof val === 'function') {
          // If it's a signal or function, wrap it so it has `.and` spy behavior if cast to spy
          const spy = createSpyFn(val);
          obj[key] = spy;
        } else {
          obj[key] = val;
        }
      });
    }
    return obj;
  },
  createSpy: (_name?: string, impl?: any) => createSpyFn(impl),
  any: (type: any) => expect.any(type),
  objectContaining: (expected: any) => expect.objectContaining(expected),
  arrayContaining: (expected: any) => expect.arrayContaining(expected),
  stringMatching: (expected: any) => expect.stringMatching(expected),
  anything: () => expect.anything(),
};
