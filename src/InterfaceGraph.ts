import * as ts from "typescript";
import { GratsDefinitionNode, TypeContext } from "./TypeContext";
import { DiagnosticsResult, err, ok } from "./utils/DiagnosticError";
import { DefaultMap } from "./utils/helpers";
import { Kind } from "graphql";

export type InterfaceImplementor = { kind: "TYPE" | "INTERFACE"; name: string };
export type InterfaceMap = DefaultMap<string, Set<InterfaceImplementor>>;

/**
 * Compute a map of interfaces to the types and interfaces that implement them.
 */
export function computeInterfaceMap(
  typeContext: TypeContext,
  docs: GratsDefinitionNode[],
): DiagnosticsResult<InterfaceMap> {
  // For each interface definition, we need to know which types and interfaces implement it.
  const graph = new DefaultMap<string, Set<InterfaceImplementor>>(
    () => new Set(),
  );

  const add = (interfaceName: string, implementor: InterfaceImplementor) => {
    graph.get(interfaceName).add(implementor);
  };

  const errors: ts.Diagnostic[] = [];

  for (const doc of docs) {
    switch (doc.kind) {
      case Kind.INTERFACE_TYPE_DEFINITION:
      case Kind.INTERFACE_TYPE_EXTENSION:
        for (const implementor of doc.interfaces ?? []) {
          const resolved = typeContext.resolveNamedType(implementor.name);
          if (resolved.kind === "ERROR") {
            // We trust that these errors will be reported elsewhere.
            continue;
          }
          add(resolved.value.value, {
            kind: "INTERFACE",
            name: doc.name.value,
          });
        }
        break;
      case Kind.OBJECT_TYPE_DEFINITION:
      case Kind.OBJECT_TYPE_EXTENSION:
        for (const implementor of doc.interfaces ?? []) {
          const resolved = typeContext.resolveNamedType(implementor.name);
          if (resolved.kind === "ERROR") {
            // We trust that these errors will be reported elsewhere.
            continue;
          }
          add(resolved.value.value, { kind: "TYPE", name: doc.name.value });
        }
        break;
    }
  }

  if (errors.length > 0) {
    return err(errors);
  }

  return ok(graph);
}
