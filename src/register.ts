import * as ts from "typescript";
import {dirname, extname, join} from "path";
import {install as sourceMap} from "source-map-support";
import {existsSync, readFileSync, unlinkSync, writeFileSync} from "fs";

const purgeStaleOutputFiles = (tsbuildinfoPath: string) => {
    const tsbuildinfo = JSON.parse(readFileSync(tsbuildinfoPath, "utf8"));
    const fileNames: string[] = tsbuildinfo.program.fileNames;
    const fileNamesToPurge = fileNames.filter(f => !f.endsWith(".d.ts") && extname(f) === ".ts" && !existsSync(f));
    fileNamesToPurge.forEach(f => {
        [".js", ".d.ts", ".js.map"].forEach(ext => {
            const path = f.replace(".ts", ext);
            if (existsSync(path)) unlinkSync(path);
        });
    });

    tsbuildinfo.program.fileNames = tsbuildinfo.program.fileNames.filter((f: string) => !fileNamesToPurge.includes(f));
    writeFileSync(tsbuildinfoPath, JSON.stringify(tsbuildinfo), "utf8");
}

const retrieveFile = (path: string): string => {
    if (existsSync(path) === false) return;
    if (extname(path) !== ".ts") return readFileSync(path, "utf-8");

    const tsconfigPath = ts.findConfigFile(path, ts.sys.fileExists);
    const tsbuildinfoPath = join(dirname(tsconfigPath), "tsconfig.tsbuildinfo");
    if (existsSync(tsbuildinfoPath)) purgeStaleOutputFiles(tsbuildinfoPath);

    const solutionBuilderHost = ts.createSolutionBuilderHost();
    const solutionBuilder = ts.createSolutionBuilder(solutionBuilderHost, [tsconfigPath], {});
    solutionBuilder.build(tsconfigPath);

    const parseConfigFileHost =  ts.sys as unknown as ts.ParseConfigFileHost
    const parsedTsconfig = ts.getParsedCommandLineOfConfigFile(tsconfigPath, {}, parseConfigFileHost);
    const compiledFilePath = ts.getOutputFileNames(parsedTsconfig, path, false)[0];
    return readFileSync(compiledFilePath, "utf-8");
}

require.extensions[".ts"] = (module: NodeJS.Module, filename) =>
    // @ts-ignore
    module._compile(retrieveFile(filename), filename);

sourceMap({
    retrieveFile,
    environment: "node",
    handleUncaughtExceptions: false
})
