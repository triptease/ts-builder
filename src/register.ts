import * as ts from "typescript";
import {dirname, extname} from "path";
import {existsSync, readFileSync} from "fs";
import {install as sourceMap} from "source-map-support";

const retrieveFile = (path: string): string => {
    if (existsSync(path) === false) return;
    if (extname(path) !== ".ts") return readFileSync(path, "utf-8");

    const tsconfigPath = ts.findConfigFile(path, ts.sys.fileExists);
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
