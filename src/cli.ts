#!/usr/bin/env node

import { GraphQLSchema, Location, lexicographicSortSchema } from "graphql";
import { getParsedTsConfig } from "./";
import {
  ParsedCommandLineGrats,
  buildSchemaResult,
  validateGratsOptions,
} from "./lib";
import { Command } from "commander";
import { writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { version } from "../package.json";
import { locate } from "./Locate";
import { printGratsSchema } from "./printSchema";

const program = new Command();

program
  .name("grats")
  .description("Extract GraphQL schema from your TypeScript project")
  .version(version)
  .option(
    "-o, --output <SCHEMA_FILE>",
    "Where to write the schema file. Defaults to stdout",
  )
  .option(
    "--tsconfig <TSCONFIG>",
    "Path to tsconfig.json. Defaults to auto-detecting based on the current working directory",
  )
  .action(async ({ output, tsconfig }) => {
    build(output, tsconfig);
  });

program
  .command("locate")
  .argument("<ENTITY>", "GraphQL entity to locate. E.g. `User` or `User.id`")
  .option(
    "--tsconfig <TSCONFIG>",
    "Path to tsconfig.json. Defaults to auto-detecting based on the current working directory",
  )
  .action((entity, { tsconfig }) => {
    const options = getParsedTsConfig(tsconfig);
    const schema = buildSchema(options);
    const loc = locate(schema, entity);
    if (loc.kind === "ERROR") {
      console.error(loc.err);
      process.exit(1);
    }
    console.log(formatLoc(loc.value));
  });

program.parse();

function build(output: string, tsconfig?: string) {
  const options = getParsedTsConfig(tsconfig);
  const schema = buildSchema(options);
  const sortedSchema = lexicographicSortSchema(schema);
  const schemaStr = printGratsSchema(sortedSchema, options.raw.grats);
  if (output) {
    const absOutput = resolve(process.cwd(), output);
    writeFileSync(absOutput, schemaStr);
    console.error(`Grats: Wrote schema to \`${absOutput}\`.`);
  } else {
    console.log(schemaStr);
  }
}

function _buildSchema(tsconfig?: string): GraphQLSchema {
  if (tsconfig && !existsSync(tsconfig)) {
    console.error(`Grats: Could not find tsconfig.json at \`${tsconfig}\`.`);
    process.exit(1);
  }
  const parsed = getParsedTsConfig(tsconfig);
  const options = validateGratsOptions(parsed);
  // FIXME: Validate config!
  // https://github.com/tsconfig/bases
  return buildSchema(options);
}

function buildSchema(options: ParsedCommandLineGrats): GraphQLSchema {
  const schemaResult = buildSchemaResult(options);
  if (schemaResult.kind === "ERROR") {
    console.error(schemaResult.err.formatDiagnosticsWithColorAndContext());
    process.exit(1);
  }

  return schemaResult.value;
}

// Format a location for printing to the console. Tools like VS Code and iTerm
// will automatically turn this into a clickable link.
export function formatLoc(loc: Location) {
  return `${loc.source.name}:${loc.startToken.line + 1}:${
    loc.startToken.column + 1
  }`;
}
