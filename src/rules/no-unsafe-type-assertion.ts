import { RuleModule } from "@typescript-eslint/experimental-utils/dist/ts-eslint";
import {
  AST_NODE_TYPES,
  ESLintUtils,
} from "@typescript-eslint/experimental-utils";
import { unionTypeParts } from "tsutils";
import ts from "typescript";
import { filterTypes } from "./common";

/**
 * An ESLint rule to ban unsafe type assertions.
 */
const noUnsafeTypeAssertion: RuleModule<
  "errorStringGeneric" | "errorStringPreferAs",
  readonly []
> = {
  meta: {
    type: "problem",
    docs: {
      category: "Possible Errors",
      description: "Bans unsafe type assertions.",
      recommended: "error",
      url: "https://github.com/danielnixon/eslint-plugin-total-functions",
    },
    messages: {
      errorStringGeneric: "This type assertion is not type-safe.",
      errorStringPreferAs: "Use the 'as' syntax for type assertions.",
    },
    schema: [],
  },
  create: (context) => {
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();

    return {
      // eslint-disable-next-line functional/no-return-void
      TSTypeAssertion: (node): void => {
        // This is the deprecated style so always error.

        // eslint-disable-next-line functional/no-expression-statement
        context.report({
          node: node,
          messageId: "errorStringPreferAs",
        });
      },
      // eslint-disable-next-line functional/no-return-void, sonarjs/cognitive-complexity
      TSAsExpression: (node): void => {
        // eslint-disable-next-line functional/no-conditional-statement
        if (node.typeAnnotation.type === AST_NODE_TYPES.TSAnyKeyword) {
          // Always allow `as any`. Other rules will catch it.
          return;
        }

        // eslint-disable-next-line functional/no-conditional-statement
        if (node.typeAnnotation.type === AST_NODE_TYPES.TSUnknownKeyword) {
          // Always allow `as unknown`.
          return;
        }

        // eslint-disable-next-line functional/no-conditional-statement
        if (
          node.typeAnnotation.type === AST_NODE_TYPES.TSTypeReference &&
          node.typeAnnotation.typeName.type === AST_NODE_TYPES.Identifier &&
          node.typeAnnotation.typeName.name === "const"
        ) {
          // Always allow `as const`.
          return;
        }

        // The right hand side of the "as".
        const destinationNode = parserServices.esTreeNodeToTSNodeMap.get(node);
        const rawDestinationType = checker.getTypeAtLocation(destinationNode);

        // The left hand side of the "as".
        const sourceNode = destinationNode.expression;
        const rawSourceType = checker.getTypeAtLocation(sourceNode);

        const { destinationType, sourceType } = filterTypes(
          rawDestinationType,
          rawSourceType
        );

        // eslint-disable-next-line functional/no-conditional-statement
        if (sourceType === destinationType) {
          // Don't flag when type assertion isn't actually changing the type.
          return;
        }

        // eslint-disable-next-line functional/no-conditional-statement
        if (destinationType === undefined || sourceType === undefined) {
          return;
        }

        // eslint-disable-next-line functional/no-conditional-statement
        if (
          destinationType.getProperties().every((p) => {
            const propertyType = checker.getTypeOfSymbolAtLocation(
              p,
              destinationNode
            );
            const destinationPropertyAllowsUndefined = unionTypeParts(
              propertyType
            ).some((t) => t.flags & ts.TypeFlags.Undefined);

            const destinationPropertyIsOptional =
              p.flags & ts.SymbolFlags.Optional;

            const sourceProperty = sourceType.getProperty(p.name);

            const sourcePropertyType =
              sourceProperty === undefined
                ? undefined
                : checker.getTypeOfSymbolAtLocation(sourceProperty, sourceNode);

            const sourcePropertyIsUndefined =
              sourcePropertyType === undefined ||
              unionTypeParts(sourcePropertyType).some(
                (t) => t.flags & ts.TypeFlags.Undefined
              );

            return (
              destinationPropertyAllowsUndefined ||
              destinationPropertyIsOptional ||
              !sourcePropertyIsUndefined
            );
          })
        ) {
          // If this is an object type with a type assertion to another object type,
          // don't flag it as an error if the properties "line up".
          // We don't need to check property types because the compiler will consider
          // that an error, e.g.:
          //
          // type Foo = { readonly foo: string };
          // const foo = { foo: 1 } as Foo; // this won't compile
          return;
        }

        // eslint-disable-next-line functional/no-expression-statement
        context.report({
          node: node,
          messageId: "errorStringGeneric",
        });
      },
    };
  },
};

export default noUnsafeTypeAssertion;
