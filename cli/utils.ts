
import * as glob from "globby";
import * as ts from "typescript";

import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { join, normalize, relative, resolve } from "path";
import { isArray } from "util";
import { findExport } from "../src/utils/directory.loader";

// Functions
export function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function remapPath(route: string) {
    const params = route.match(/:[a-zA-Z0-9]+/gi) || [];

    return params.reduce((prev, rawParam) => {
        const param = `{${rawParam.substring(1, rawParam.length)}}`;
        return prev.replace(rawParam, param);
    }, route);
}

export function writeFile(filename: string, content: string) {
    return writeFileSync(resolve(process.cwd(), filename), content.trim(), { encoding: "UTF-8" });
}

export function writeJsonFile(filename: string, content: object) {
    return writeFileSync(resolve(process.cwd(), filename), JSON.stringify(content, null, 4), { encoding: "UTF-8" });
}

export function urlMapper(ts: string, basePath: string, outDir: string, rootDirs: string | string[]) {
    let confirmedRoot = "";
    let prefix = "";

    if (isArray(rootDirs)) {
        for (const rootDir of rootDirs) {
            const possiblePrefix = normalize(join(basePath, rootDir));
            if (ts.startsWith(possiblePrefix)) {
                confirmedRoot = rootDir;
                prefix = possiblePrefix;

                break;
            }
        }

    } else {
        prefix = normalize(join(basePath, rootDirs));
    }

    if (!prefix) {
        throw new Error("Can't find path alias");
    }

    const suffix = ts.replace(prefix, "");
    return join(basePath, outDir, isArray(rootDirs) ? (join(confirmedRoot, suffix)) : suffix);
}

// Commands
export function execCommands(commands: string[]) {
    for (const command of commands) {
        execSync(command, { stdio: "inherit" });
    }
}

// TypeSript files injection
export interface IjectionResult {
    tsPath: string;
    jsPath: string;
    classType: any;
}

export function injectTsFiles(pattern: string | string[], rawBasePath = process.cwd(), tsconfig?: string) {
    const basePath = normalize(rawBasePath);
    const tsconf = tsconfig || ts.findConfigFile(basePath, ts.sys.fileExists);
    const results: IjectionResult[] = [];

    if (!tsconf) {
        throw new Error("Can't find tsconfig");
    }

    const { config: { compilerOptions }}  = ts.readConfigFile(tsconf, ts.sys.readFile);

    glob.sync(pattern).forEach((path) => {
        const tsPath = normalize(path);
        const jsPath = normalize(urlMapper(tsPath, basePath, compilerOptions.outDir, compilerOptions.rootDir || compilerOptions.rootDirs).replace(/\.(ts|tsx)$/, ""));

        const module: any = require(relative(__dirname, jsPath));

        const classType = findExport(module);

        if (classType) {
            results.push({ classType, jsPath, tsPath: normalize(tsPath) });
        }
    });

    return results;
}
