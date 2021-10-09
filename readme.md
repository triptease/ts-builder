## @theomessin/ts-builder

`ts-builder` is a simple script that enables Node.js to require TypeScript files.
It is similar to [`ts-node`](https://github.com/TypeStrong/ts-node).

It uses `tsc --build` to build a TypeScript project including any [references](https://www.typescriptlang.org/docs/handbook/project-references.html).
The new [TypeScript build mode](https://www.typescriptlang.org/docs/handbook/project-references.html#build-mode-for-typescript) is quite fast as it uses a cache to perform smart incremental builds.

### Installation
Install the package from [npm](https://www.npmjs.com/package/@theomessin/ts-builder):

```
npm install --save-dev @theomessin/ts-builder
```

You may then use `ts-builder` by registering it with Node.js:

```
node -r @theomessin/ts-builder foobar.ts
```

### Behind the Scenes
`ts-builder` will register itself as the handler for all `*.ts` files. When a `*.ts` file is required the following steps will be performed.

1. The corresponding `tsconfig.json` for that file will be found.
2. The project will be built using `tsc --build`. This will build any project references. The `outDir` will be unaltered so compiled files will be saved as configured in `tsconfig.json`.
3. The contents of the compiled `.js` file of the given `.ts` file will be returned.

### Using with Mocha
[`ts-node` does not support project references](https://github.com/TypeStrong/ts-node/issues/897), which means that [Mocha](https://mochajs.org/#-require-module-r-module) could not be used with TypeScript project references and the new build system.
However, `ts-builder` can be used instead. 

Just run mocha with `-r @theomessin/ts-builder/register`.
Alternatively, register `ts-builder` in your `.mocharc.js`:

```js
module.exports = {
  extension: ['ts'],
  require: [
    '@theomessin/ts-builder/register',
  ],
};
```
