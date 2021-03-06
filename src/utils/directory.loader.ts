import "reflect-metadata";

import * as glob from "globby";
import * as path from "path";

import { isPrimitive } from "util";
import { MAIN_COMPONENTS } from "../definitions";
import { Constructor, Instance } from "../types";

export interface ILoader<T = any> {
    processBase(...args: any[]): Promise<(constructor: Constructor<T>, filePath?: string) => Promise<Instance<T>>>;
}

export function inject(pattern: string | string[], reworker: (constructor: Constructor, filePath: string) => any) {
    glob.sync(pattern).forEach((drpath) => {
        const imp: any = require(path.relative(__dirname, drpath));
        const typeClass: any = findExport(imp);

        if (typeClass) {
            reworker(typeClass, drpath);
        } else {}
            // console.warn('No matching classes in files autoloading files')
    });
}

export function reflectProperties(obj: Instance): string[] {
    return (Object.keys(obj));
}

export function reflectOwnProperties(obj: Instance): string[] {
    const proto = Object.getPrototypeOf(obj);
    return Object.getOwnPropertyNames(proto);
}

export function reflectClassMethods(cls: Function): string[] {
    return Object.getOwnPropertyNames(cls.prototype);
}

export function reflectParameters(target: Instance, key?: string | symbol): Array<unknown> {
    if (key) {
        return Reflect.getMetadata("design:paramtypes", target, key);
    }

    return Reflect.getMetadata("design:paramtypes", target);
}

export function reflectType(target: Function | Instance, key?: string | symbol) {
    if (key) {
        return Reflect.getMetadata("design:type", target, key);
    }

    return Reflect.getMetadata("design:type", target);
}

export const isFunction = (target: Instance, propertyKey: string | symbol) => (propertyKey && typeof (target as any)[propertyKey] == "function" && propertyKey != "constructor");

export function findExport(imp: any): any {
    if (imp.default && isMainComponent(imp.default)) {
        return imp.default;
    }

    for (const key in imp) {

        if (isPrimitive(imp[key])) {
            continue;
        }

        if (isMainComponent(imp[key])) {
            return imp[key];
        }
    }

    return null;
}

function isMainComponent(target: Instance | Function) {
    for (const componentKey of MAIN_COMPONENTS) {
        if (Reflect.hasMetadata(componentKey, target)) {
            return true;
        }
    }

    return false;
}
