import { RuleModule } from "@typescript-eslint/experimental-utils/dist/ts-eslint";
import { ESLintUtils } from "@typescript-eslint/experimental-utils";
import { isTupleTypeReference, unionTypeParts } from "tsutils";
import ts from "typescript";

/**
 * An ESLint rule to ban unsafe array/object destructuring, which is not well-typed in TypeScript.
 */
const noUnsafeDestructuring: RuleModule<"errorStringGeneric", readonly []> = {
  meta: {
    type: "problem",
    docs: {
      category: "Possible Errors",
      description:
        "Array and object destructuring are not type-safe in TypeScript.",
      recommended: "error",
      url: "https://github.com/danielnixon/eslint-plugin-total-functions",
    },
    messages: {
      errorStringGeneric: "This destructuring is not type-safe in TypeScript.",
    },
    schema: [],
  },
  // eslint-disable-next-line sonarjs/cognitive-complexity
  create: (context) => {
    const parserServices = ESLintUtils.getParserServices(context);

    // eslint-disable-next-line functional/no-conditional-statement
    if (
      parserServices.program.getCompilerOptions().noUncheckedIndexedAccess ===
      true
    ) {
      // We don't need this rule if noUncheckedIndexedAccess is on.
      return {};
    }

    const checker = parserServices.program.getTypeChecker();

    return {
      // eslint-disable-next-line functional/no-return-void
      ArrayPattern: (node): void => {
        const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);

        // eslint-disable-next-line functional/no-conditional-statement
        if (tsNode.kind === ts.SyntaxKind.ArrayLiteralExpression) {
          // TODO: how does an ESLint ArrayPattern map to a TypeScript ArrayLiteralExpression?
          return;
        }

        const type = checker.getTypeAtLocation(tsNode);

        // eslint-disable-next-line functional/no-conditional-statement
        if (
          isTupleTypeReference(type) &&
          node.elements.length <= type.target.minLength
        ) {
          // Allow tuples (whether partial or not) if the indexes
          // we're destructuring are all know to be safe at compile time.
          return;
        }

        const numberIndexType = type.getNumberIndexType();

        // eslint-disable-next-line functional/no-conditional-statement
        if (
          numberIndexType !== undefined &&
          unionTypeParts(numberIndexType).find(
            (t) => t.flags & ts.TypeFlags.Undefined
          ) !== undefined
        ) {
          // Allow destructuring if undefined is already in the array type.
          return;
        }

        // eslint-disable-next-line functional/no-expression-statement
        context.report({
          node: node,
          messageId: "errorStringGeneric",
        } as const);
      },
      // eslint-disable-next-line functional/no-return-void
      ObjectPattern: (node): void => {
        const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);

        // eslint-disable-next-line functional/no-conditional-statement
        if (tsNode.kind === ts.SyntaxKind.ObjectLiteralExpression) {
          // TODO: how does an ESLint ObjectPattern map to a TypeScript ObjectLiteralExpression?
          return;
        }

        const type = checker.getTypeAtLocation(tsNode);

        // True if every element we're destructuring is known to exist at compile time (or is the rest element).
        const isSafe = tsNode.elements.every((prop) => {
          const isRestElement = prop.dotDotDotToken !== undefined;

          const propertyName =
            prop.propertyName !== undefined &&
            prop.propertyName.kind !== ts.SyntaxKind.ComputedPropertyName
              ? prop.propertyName.text
              : prop.name.kind === ts.SyntaxKind.Identifier
              ? prop.name.text
              : undefined;

          return (
            isRestElement ||
            type
              .getProperties()
              .some(
                (p) => p.name === propertyName || p.escapedName === propertyName
              )
          );
        });

        // eslint-disable-next-line functional/no-conditional-statement
        if (isSafe) {
          return;
        }

        // eslint-disable-next-line functional/no-expression-statement
        context.report({
          node: node,
          messageId: "errorStringGeneric",
        } as const);
      },
    };
  },
};

export default noUnsafeDestructuring;
