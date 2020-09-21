import type { RuleModule } from "@typescript-eslint/experimental-utils/dist/ts-eslint";
import {
  ESLintUtils,
  AST_NODE_TYPES,
  TSESTree,
} from "@typescript-eslint/experimental-utils";
import { isTupleTypeReference, unionTypeParts } from "tsutils";
import ts from "typescript";

/**
 * An ESLint rule to ban unsafe usage of the array/object index operator, which is not well-typed in TypeScript.
 * @see https://github.com/Microsoft/TypeScript/issues/13778
 */
const noUnsafeSubscript: RuleModule<"errorStringGeneric", readonly []> = {
  meta: {
    type: "problem",
    docs: {
      category: "Possible Errors",
      description:
        "Array and object member access are not type-safe in TypeScript.",
      recommended: "error",
      url: "https://github.com/danielnixon/eslint-plugin-total-functions",
    },
    messages: {
      errorStringGeneric: "This member access is not type-safe in TypeScript.",
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

    const reportUnsafeSubscriptAccess = (
      node: TSESTree.MemberExpression
      // eslint-disable-next-line functional/no-return-void, sonarjs/cognitive-complexity
    ): void => {
      // eslint-disable-next-line functional/no-conditional-statement
      if (
        node.parent !== undefined &&
        node.parent.type === AST_NODE_TYPES.AssignmentExpression &&
        node.parent.left === node
      ) {
        // This is the left hand side of an array assignment, so there's no partiality issue here.
        // eslint-plugin-functional will catch the mutation.
        return;
      }

      const contextualType = checker.getContextualType(
        parserServices.esTreeNodeToTSNodeMap.get(node)
      );

      const contextualTypeContainsUndefined =
        contextualType !== undefined &&
        unionTypeParts(contextualType).some(
          (t) => t.flags & ts.TypeFlags.Undefined
        );

      // If this is the right hand side of an assignment or declaration we can't trust the contextual type.
      // See https://github.com/danielnixon/eslint-plugin-total-functions/issues/68 for details.
      const isRhsOfAssignment =
        node.parent !== undefined &&
        (node.parent.type === AST_NODE_TYPES.AssignmentExpression ||
          node.parent.type === AST_NODE_TYPES.VariableDeclarator);

      // eslint-disable-next-line functional/no-conditional-statement
      if (contextualTypeContainsUndefined && !isRhsOfAssignment) {
        // Contextual type includes (or is) undefined.
        // See https://www.typescriptlang.org/docs/handbook/type-inference.html#contextual-typing
        return;
      }

      const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node.object);
      const type = checker.getTypeAtLocation(tsNode);

      const numberIndexType = type.getNumberIndexType();
      // eslint-disable-next-line functional/no-conditional-statement
      if (
        numberIndexType !== undefined &&
        unionTypeParts(numberIndexType).some(
          (t) => t.flags & ts.TypeFlags.Undefined
        )
      ) {
        // Allow member access if undefined is already in the array type.
        return;
      }

      const stringIndexType = type.getStringIndexType();
      // eslint-disable-next-line functional/no-conditional-statement
      if (
        stringIndexType !== undefined &&
        unionTypeParts(stringIndexType).some(
          (t) => t.flags & ts.TypeFlags.Undefined
        )
      ) {
        // Allow member access if undefined is already in the record type.
        return;
      }

      // eslint-disable-next-line functional/no-conditional-statement
      if (
        isTupleTypeReference(type) &&
        node.property.type === AST_NODE_TYPES.Literal &&
        typeof node.property.value === "number" &&
        node.property.value < type.target.minLength
      ) {
        // Allow tuples (with or without a ...rest element) if
        // the index we're accessing is known to be safe at compile time.
        return;
      }

      // eslint-disable-next-line functional/no-conditional-statement
      if (isTupleTypeReference(type) && type.target.hasRestElement === false) {
        // Always allow tuples without a ...rest element.
        // If this access is invalid TypeScript itself will catch it.
        return;
      }

      // eslint-disable-next-line functional/no-conditional-statement
      if (
        type.getStringIndexType() === undefined &&
        type.getNumberIndexType() === undefined
      ) {
        // Allow member access when there is no index signature in the object (i.e. when this object is not a Record<string, B> or a Record<number, B>).
        // If this access is invalid TypeScript itself will catch it.
        return;
      }

      // eslint-disable-next-line functional/no-conditional-statement
      if (
        node.property.type === AST_NODE_TYPES.Identifier &&
        type.getProperty(node.property.name) !== undefined
      ) {
        // Allow member access if the object type is known to contain a member with that name.
        return;
      }

      // eslint-disable-next-line functional/no-expression-statement
      context.report({
        node: node,
        messageId: "errorStringGeneric",
      });
    };

    return {
      // eslint-disable-next-line functional/no-return-void
      MemberExpression: (node): void => {
        return reportUnsafeSubscriptAccess(node);
      },
    };
  },
};

export default noUnsafeSubscript;
