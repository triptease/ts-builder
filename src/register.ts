import * as ts from "typescript";
import {dirname, extname, join} from "path";
import {existsSync, readFileSync, unlinkSync, writeFileSync} from "fs";
import {install as sourceMap} from "source-map-support";

const retrieveFile = (path: string): string => {
    if (existsSync(path) === false) return;
    if (extname(path) !== ".ts" && extname(path) !== ".tsx") return readFileSync(path, "utf-8");

    const tsconfigPath = ts.findConfigFile(path, ts.sys.fileExists);
    const parseConfigFileHost =  ts.sys as unknown as ts.ParseConfigFileHost
    const parsedTsconfig = ts.getParsedCommandLineOfConfigFile(tsconfigPath, {}, parseConfigFileHost);

    const tsBuilderConfig = {...parsedTsconfig.raw, compilerOptions: {
        ...parsedTsconfig.raw.compilerOptions, 
        jsx: "react",
        tsBuildInfoFile: "tsconfig.tsbuildinfo",
    }};

    const tsBuilderConfigPath = join(dirname(tsconfigPath), "tsconfig.tsbuilder.json");
    writeFileSync(tsBuilderConfigPath, JSON.stringify(tsBuilderConfig));

    const solutionBuilderHost = ts.createSolutionBuilderHost();
    const solutionBuilder = ts.createSolutionBuilder(solutionBuilderHost, [tsBuilderConfigPath], {});
    solutionBuilder.build(tsBuilderConfigPath);
    unlinkSync(tsBuilderConfigPath);

    // TODO: parse the tsBuilderConfig instead of the original one.
    let compiledFilePath = ts.getOutputFileNames(parsedTsconfig, path, false)[0];
    if (extname(compiledFilePath) === ".jsx") compiledFilePath = compiledFilePath.slice(0, -1);
    return readFileSync(compiledFilePath, "utf-8");
}

require.extensions[".ts"] = require.extensions[".tsx"] = (module: NodeJS.Module, filename) =>
    // @ts-ignore
    module._compile(retrieveFile(filename), filename);

sourceMap({
    retrieveFile,
    environment: "node",
    handleUncaughtExceptions: false
})
