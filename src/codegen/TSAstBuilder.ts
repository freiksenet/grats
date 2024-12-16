import * as ts from "typescript";
import { isNonNull } from "../utils/helpers";
import * as path from "path";
import { resolveRelativePath } from "../gratsRoot";

const F = ts.factory;

/**
 * A helper class to build up a TypeScript document AST.
 */
export default class TSAstBuilder {
  _imports: ts.Statement[] = [];
  imports: Map<string, { name: string; as?: string }[]> = new Map();
  _helpers: ts.Statement[] = [];
  _statements: ts.Statement[] = [];

  constructor(
    private _destination: string,
    private importModuleSpecifierEnding: string,
  ) {}
  addHelper(statement: ts.Statement) {
    this._helpers.push(statement);
  }
  addStatement(statement: ts.Statement) {
    this._statements.push(statement);
  }

  createBlockWithScope(closure: () => void): ts.Block {
    const initialStatements = this._statements;
    this._statements = [];
    closure();
    const block = F.createBlock(this._statements, true);
    this._statements = initialStatements;
    return block;
  }

  // Helper for the common case.
  method(
    name: string,
    params: ts.ParameterDeclaration[],
    statements: ts.Statement[],
  ): ts.MethodDeclaration {
    return F.createMethodDeclaration(
      undefined,
      undefined,
      name,
      undefined,
      undefined,
      params,
      undefined,
      F.createBlock(statements, true),
    );
  }

  // Helper for the common case of a single string argument.
  param(name: string, type?: ts.TypeNode): ts.ParameterDeclaration {
    return F.createParameterDeclaration(
      undefined,
      undefined,
      name,
      undefined,
      type,
      undefined,
    );
  }

  functionDeclaration(
    name: string,
    modifiers: ts.Modifier[] | undefined,
    type: ts.TypeNode | undefined,
    body: ts.Block,
  ): void {
    this.addStatement(
      F.createFunctionDeclaration(
        modifiers,
        undefined,
        name,
        undefined,
        [],
        type,
        body,
      ),
    );
  }

  // Helper to allow for nullable elements.
  objectLiteral(
    properties: Array<ts.ObjectLiteralElementLike | null>,
  ): ts.ObjectLiteralExpression {
    return F.createObjectLiteralExpression(properties.filter(isNonNull), true);
  }

  constDeclaration(
    name: string,
    initializer: ts.Expression,
    type?: ts.TypeNode,
  ): void {
    this.addStatement(
      F.createVariableStatement(
        undefined,
        F.createVariableDeclarationList(
          [
            F.createVariableDeclaration(
              F.createIdentifier(name),
              undefined,
              type,
              initializer,
            ),
          ],
          ts.NodeFlags.Const,
        ),
      ),
    );
  }

  import(from: string, names: { name: string; as?: string }[]) {
    let moduleImports = this.imports.get(from);
    if (moduleImports == null) {
      moduleImports = [];
      this.imports.set(from, moduleImports);
    }
    for (const { name, as } of names) {
      let seen = false;
      for (const imp of moduleImports) {
        if (imp.name === name && imp.as === as) {
          seen = true;
        }
      }
      if (!seen) {
        moduleImports.push({ name, as });
      }
    }
  }

  importDefault(from: string, as: string) {
    this._imports.push(
      F.createImportDeclaration(
        undefined,
        F.createImportClause(false, F.createIdentifier(as), undefined),
        F.createStringLiteral(from),
      ),
    );
  }

  importUserConstruct(
    tsModulePath: string,
    exportName: string | null,
    localName: string,
  ): void {
    const abs = resolveRelativePath(tsModulePath);
    const relative = replaceExt(
      path.relative(path.dirname(this._destination), abs),
      this.importModuleSpecifierEnding,
    );
    const modulePath = `./${normalizeRelativePathToPosix(relative)}`;
    if (exportName == null) {
      this.importDefault(modulePath, localName);
    } else {
      this.import(modulePath, [{ name: exportName, as: localName }]);
    }
  }

  print(): string {
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const sourceFile = ts.createSourceFile(
      "tempFile.ts",
      "",
      ts.ScriptTarget.Latest,
      false,
      ts.ScriptKind.TS,
    );

    for (const [from, names] of this.imports) {
      const namedImports = names.map((name) => {
        if (name.as) {
          return F.createImportSpecifier(
            false,
            F.createIdentifier(name.name),
            F.createIdentifier(name.as),
          );
        } else {
          return F.createImportSpecifier(
            false,
            undefined,
            F.createIdentifier(name.name),
          );
        }
      });
      this._imports.push(
        F.createImportDeclaration(
          undefined,
          F.createImportClause(
            false,
            undefined,
            F.createNamedImports(namedImports),
          ),
          F.createStringLiteral(from),
        ),
      );
    }

    return printer.printList(
      ts.ListFormat.MultiLine,
      F.createNodeArray([
        ...this._imports,
        ...this._helpers,
        ...this._statements,
      ]),
      sourceFile,
    );
  }
}
function replaceExt(filePath: string, newSuffix: string): string {
  const ext = path.extname(filePath);
  return filePath.slice(0, -ext.length) + newSuffix;
}

// https://github.com/sindresorhus/slash/blob/98b618f5a3bfcb5dd374b204868818845b87bb2f/index.js#L8C9-L8C33
function normalizeRelativePathToPosix(unknownPath: string): string {
  return unknownPath.replace(/\\/g, "/");
}