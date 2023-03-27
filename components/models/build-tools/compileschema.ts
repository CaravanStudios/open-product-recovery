#!/usr/bin/env node
/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Command} from 'commander';
import {compile, JSONSchema} from 'json-schema-to-typescript';
import fs from 'fs';
import path from 'path';
import process from 'process';
import glob from 'glob-promise';

const LICENSE_HEADER =
  '/**\n' +
  ' * Copyright 2022 Google LLC\n' +
  ' *\n' +
  ' * Licensed under the Apache License, Version 2.0 (the "License");\n' +
  ' * you may not use this file except in compliance with the License.\n' +
  ' * You may obtain a copy of the License at\n' +
  ' *\n' +
  ' *      http://www.apache.org/licenses/LICENSE-2.0\n' +
  ' *\n' +
  ' * Unless required by applicable law or agreed to in writing, software\n' +
  ' * distributed under the License is distributed on an "AS IS" BASIS,\n' +
  ' * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,' +
  ' either express or implied.\n' +
  ' * See the License for the specific language governing permissions and\n' +
  ' * limitations under the License.\n' +
  ' */\n';
const IGNORE_MAX_LEN = '/* eslint max-len: 0 */\n';

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

interface TypeSection {
  typeName: string;
  startIndex: number;
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
  const typeMappingDeclarations = [] as Array<string>;
  for (const typeName in typeNameToSchema) {
    const schemaFile = typeNameToSchema[typeName];
    const schemaDir = path.dirname(schemaFile.path);
    const schemaJson = schemaFile.schemaJson as JSONSchema;
    typeMappingDeclarations.push(`  ${schemaJson.title}: ${schemaJson.title};`);
    typeMappingDeclarations.push(
      `  ['${schemaJson.$id}']: ${schemaJson.title};`
    );
    let compiled = await compile(schemaJson, typeName, {
      cwd: schemaDir,
      bannerComment: '',
      style: {
        printWidth: 80,
        singleQuote: true,
      },
      ignoreMinAndMaxItems: true,
      declareExternallyReferenced: false,
    });
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
    // dependent schemas even though we've told it not to. So we find all type
    // definitions in the file and discard any that do not have the same name
    // as the JSON schema title.
    const lineDef = /^\s*export\s+(type|interface)\s+(.*)\s+[={].*$/gm;
    const typeSections: Array<TypeSection> = [];
    let lineDefMatch;
    while ((lineDefMatch = lineDef.exec(compiled)) !== null) {
      let startIndex = 0;
      for (let pos = lineDefMatch.index - 1; pos >= 0; pos--) {
        if (compiled.charAt(pos) === '}' || compiled.charAt(pos) === ';') {
          startIndex = pos + 2;
          break;
        }
      }
      const currentTypeSection = {
        typeName: lineDefMatch[2],
        startIndex: startIndex,
      } as TypeSection;
      typeSections.push(currentTypeSection);
    }
    if (typeSections.length > 1) {
      for (let i = 0; i < typeSections.length; i++) {
        const typeSection = typeSections[i];
        if (typeSection.typeName === typeName) {
          compiled = compiled.substring(
            typeSection.startIndex,
            i < typeSections.length - 1
              ? typeSections[i + 1].startIndex - 1
              : compiled.length
          );
        } else {
          console.log(
            'Discarded re-definition of',
            typeSection.typeName,
            'in compiled output for',
            schemaFile.path
          );
        }
      }
    }
    compiledTypes.push(compiled);
    const relativeImport = path.relative(targetDir, schemaFile.path);
    schemaImports.push(
      `export {default as ${typeName}} from '${relativeImport}';`
    );
  }
  compiledTypes.push('export interface SchemaNameToType {');
  compiledTypes.push(...typeMappingDeclarations);
  compiledTypes.push('}\n');

  compiledTypes.unshift('/* eslint-disable */');
  compiledTypes.unshift(
    '/* DO NOT EDIT - Automatically generated from json schema files */\n'
  );
  compiledTypes.unshift(LICENSE_HEADER);
  schemaImports.unshift(IGNORE_MAX_LEN);
  schemaImports.unshift(LICENSE_HEADER);

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
