#!/usr/bin/env node
import {Command} from 'commander';
import {compile, JSONSchema} from 'json-schema-to-typescript';
import fs from 'fs';
import path from 'path';
import process from 'process';
import glob from 'glob-promise';
const program = new Command();

program
  .description(
    'Compiles JSON schema files to typescript files and ' +
      'generates a single output file for all typescript definitions. Also ' +
      'generates a single index file for JSON schema imports.'
  )
  .option('-p, --prefix <dir>', 'Sets the current working directory.')
  .option('-s, --src <...glob>', 'Sets the glob pattern for source files')
  .option(
    '-o, --out <dir>',
    'Sets the output directory for compiled types',
    'types-generated'
  )
  .option(
    '-t, --typefile <name>',
    'The name of the generated types file',
    'types.ts'
  )
  .option('--no-typefile', 'Disables generation of the typescript types')
  .option(
    '--schemafile <name>',
    'The name of the generated schema bulk-import file',
    'schemas.ts'
  )
  .option('--no-schemafile', 'Disables generation of the typescript types');
program.parse(process.argv);
const options = program.opts();

interface SchemaFile {
  schemaJson: unknown;
  path: string;
}

async function main() {
  if (options.prefix) {
    process.chdir(options.prefix);
  }

  const targetDir = options.out;
  fs.mkdirSync(targetDir, {recursive: true});

  const typeNameToSchema = {} as Record<string, SchemaFile>;
  const schemaFilePaths = await glob(options.src);
  for (const schemaFilePath of schemaFilePaths) {
    console.log('Compiling', schemaFilePath);
    const schemaText = (await fs.promises.readFile(schemaFilePath)).toString();
    const schemaJson = JSON.parse(schemaText);
    const typeName = schemaJson.title;
    if (!typeName) {
      throw new Error('No typename found at ' + schemaFilePath);
    }
    const existingSchema = typeNameToSchema[typeName];
    if (existingSchema) {
      throw new Error(
        `${typeName} defined in ${existingSchema.path} and ${schemaFilePath}`
      );
    }
    typeNameToSchema[typeName] = {
      path: schemaFilePath,
      schemaJson: schemaJson,
    };
  }
  const compiledTypes = [] as Array<string>;
  const schemaImports = [] as Array<string>;
  for (const typeName in typeNameToSchema) {
    const schemaFile = typeNameToSchema[typeName];
    const schemaDir = path.dirname(schemaFile.path);
    let compiled = await compile(
      schemaFile.schemaJson as JSONSchema,
      typeName,
      {
        cwd: schemaDir,
        bannerComment: '',
        style: {
          printWidth: 80,
          singleQuote: true,
        },
        ignoreMinAndMaxItems: true,
        declareExternallyReferenced: false,
      }
    );
    // The schema compiler contains a bug where if the same schema is referenced
    // twice in an ancestor schema under different parents, each instance of
    // that type will be assigned a new name by appending a number after it.
    // This obviously doesn't work for us, so we find and remove those
    // trailing numbers.
    for (const schemaType in typeNameToSchema) {
      const regexp = new RegExp(schemaType + '\\d+', 'g');
      const fixedCompiled = compiled.replace(regexp, schemaType);
      if (fixedCompiled !== compiled) {
        console.log(
          'Fixed bad class renaming of',
          schemaType,
          'in',
          schemaFile.path
        );
      }
      compiled = fixedCompiled;
    }
    // The schema compiler seems to contain a bug where it sometimes re-defines
    // dependent schemas even though we've told it not to. So, we look for an
    // 'export' definition after the first one and delete it and anything that
    // follows it.
    const extraExports = /(?!^)\/\*(\*(?!\/)|[^*])*\*\/\s*export/gs.exec(
      compiled
    );
    if (extraExports) {
      console.log('!!! Deleted extra imports from', typeName);
      compiled = compiled.substring(0, extraExports.index);
    }
    compiledTypes.push(compiled);
    const relativeImport = path.relative(targetDir, schemaFile.path);
    schemaImports.push(
      `export {default as ${typeName}} from '${relativeImport}';`
    );
  }
  compiledTypes.unshift('/* eslint-disable */');
  compiledTypes.unshift(
    '/* DO NOT EDIT - Automatically generated from json schema files */\n'
  );

  if (options.typefile) {
    fs.writeFileSync(
      targetDir + '/' + options.typefile,
      compiledTypes.join('\n')
    );
  }
  if (options.schemafile) {
    fs.writeFileSync(
      targetDir + '/' + options.schemafile,
      schemaImports.join('\n') + '\n'
    );
  }
}
main();
