import { RuleModule } from "@typescript-eslint/experimental-utils/dist/ts-eslint";
import {
  AST_NODE_TYPES,
  ESLintUtils,
} from "@typescript-eslint/experimental-utils";
import { isObjectType } from "tsutils";
import * as ts from "typescript";

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
      // eslint-disable-next-line functional/no-return-void
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

        // TODO allow safe type assertions.
        const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);
        const destinationType = checker.getTypeAtLocation(tsNode);
        const sourceType = checker.getTypeAtLocation(tsNode.expression);

        // eslint-disable-next-line functional/no-conditional-statement
        if (
          isObjectType(destinationType) &&
          isObjectType(sourceType) &&
          destinationType.getProperties().every((p) => {
            return (
              p.flags & ts.SymbolFlags.Optional ||
              sourceType.getProperty(p.name) !== undefined
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
          //
          // TODO: this allows a property to be missing from the source type if it is optional in the destination type,
          // but it doesn't allow it if the property in the destination is a union that includes undefined.
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
