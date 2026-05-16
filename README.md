# upjs-plato

Visualize JavaScript source complexity with plato.
Based on the older es5 plato, this is a port to `es6` and `eslint`

This project is a fork of [es6-plato](https://github.com/the-simian/es6-plato)

# The Report
![dank-es6-nugs](https://cloud.githubusercontent.com/assets/954596/18904556/3a81efea-8524-11e6-8588-ad8f5a51b001.PNG)

## Run with NPX

```bash
npx upjs-plato -r -d ./report src
```

This command will download upjs-plato in a temp directory and run the report inspecting the files inside the `src` directory.

> NOTE: if you have a `.browserslistrc` file in the directory and `upjs-plato` fails to run with polyfill errors, temporarily delete the `.browserslistrc` file or move the configuration inside the `package.json` file with a `browserslist` key https://github.com/browserslist/browserslist.

## Add to a project in 3 steps

1. Install.
```bash
npm install --save-dev upjs-plato

# or

yarn add upjs-plato --dev
```

2. Add.

```json
"scripts" : {
    "complexity-report": "./node_modules/.bin/upjs-plato -r -d ./report src",
}
```

3. Run.
```bash
npm run complexity-report

# or

yarn complexity-report
```

## Installation

Install the module with: `npm install --save-dev upjs-plato` or `yarn add upjs-plato --dev`

## Usage

### From scripts

```js
//be sure and set your src, output, and any options.
let src = "./scripts/**/*.js";
let outputDir = "./artifacts/plato";

let platoArgs = {
  title: "example",
  eslint: {}
};

//you can use the reports in the callback.
function callback(reports) {
  let overview = plato.getOverviewReport(reports);

  let { total, average } = overview.summary;

  let output = `total
    ----------------------
    eslint: ${total.eslint}
    sloc: ${total.sloc}
    maintainability: ${total.maintainability}
    average
    ----------------------
    eslint: ${average.eslint}
    sloc: ${average.sloc}
    maintainability: ${average.maintainability}`;

  console.log(output);
}

//usage is plato.inspect
plato.inspect(src, outputDir, platoArgs, callback);
```

# Example Gulpfile

```js
let gulp = require("gulp");
let plato = require("upjs-plato");

let src = "./scripts/**/*.js";
let outputDir = "./artifacts/plato";

let lintRules = {
  rules: {
    indent: [2, "tab"],
    quotes: [2, "single"],
    semi: [2, "always"],
    "no-console": [1],
    curly: ["error"],
    "no-dupe-keys": 2,
    "func-names": [1, "always"]
  },
  env: {
    es6: true
  },
  globals: ["require"],
  parserOptions: {
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
      modules: true
    }
  }
};

let complexityRules = {};

let platoArgs = {
  title: "example",
  eslint: lintRules,
  complexity: complexityRules
};

function analysis() {
  return plato.inspect(src, outputDir, platoArgs);
}

gulp.task("analysis", analysis);
```

### From the commandline

```sh
Usage : upjs-plato [options] -d <output_dir> <input files>
  -h, --help
      Display this help text.
  -q, --quiet
      Reduce output to errors only
  -v, --version
      Print the version.
  -x, --exclude : String
      File exclusion regex
  -d, --dir : String *required*
      The output directory
  -r, --recurse
      Recursively search directories
  -l, --jshint : String
      Specify a jshintrc file for JSHint linting
  -t, --title : String
      Title of the report
  -T, --targetNode : Number
      Target Node version for the depngn compatibility report. The -p option is required for depngn to run.
  -D, --date : String
      Time to use as the report date (seconds, > 9999999999 assumed to be ms)
  -n, --noempty
      Skips empty lines from line count
  -e, --eslintConfig : String
      Specify a ESLint configuration file for ESLint linting
  -b, --babelConfig : String
      Specify a Babel configuration file for project parsing
  -p, --projectRoot : String
      Root directory of the project to analyze. Needed to run audit/outdated/depngn analysis. Must contain a "lock" file with the project's dependencies. If omitted, defaults to the current working directory.
```

**Examples**

```shell
upjs-plato -r -d report src
# analyze the files in `src` dir and run audit and outdated. Store the report in the `report` dir.
```

```shell
upjs-plato -r -T 20 -d report src
# analyze the files in `src` dir and run audit, outdated, and depngn with node 20 as the target. Store the report in the `report` dir
```

```shell
upjs-plato -r -p ./app1 -T 20 -d report ./app1/src
# analyze the files in `app1/src` dir and run audit, outdated, and depngn with node 20 as the target for the app in the `app1` directory. Store the report in the `report` dir

# this is useful for mono-repos with multiple projects
```

> Note for Windows Users:
 If you are on Windows, you might want to put your glob in quotes if you use a tool such as cygwin, conemu or some other emulator, and you are also targeting files in directories, otherwise the emulator might incorrectly expand the glob before it is handled internally by es6-plato. For instance, if you want to use `/src/**/*.js` and the results are ignoring the root try `'./src/**/*.js'` instead.
>


![class functions, ya'll](https://cloud.githubusercontent.com/assets/954596/18904476/d1a57302-8523-11e6-85df-b474be8c59a8.PNG)

## Data sources

- Complexity from [typhonjs-escomplex](https://github.com/typhonjs-node-escomplex/typhonjs-escomplex)
- Lint data from [eslint](http://eslint.org/)

## Contributors

- [Jesse Harlin](https://github.com/the-simian)
- [Jarrod Overson](https://github.com/jsoverson)
- [Craig Davis](https://github.com/there4)
- [David Linse](https://github.com/davidlinse)

## Release History

See [CHANGELOG.md](./CHANGELOG.md) for the list of releases and what changed in each.

## About

This is currently a reimplementation of the older plato, and started as a fork from https://github.com/deedubs/es6-plato, but has since been heavily modified.
After seeing it was unpublished on npm and also wanting to add more features, I Asked if it [would be alright for me to publish and continue the work.](https://github.com/deedubs/es6-plato/issues/4)
This project uses eslint, not jshint for default linting.

I have switched to the [typhon-js](https://github.com/typhonjs-node-escomplex/typhonjs-escomplex) module since it properly parses classes.

## License

Copyright (c) 2012 Jesse Harlin
Licensed under the MIT license.
