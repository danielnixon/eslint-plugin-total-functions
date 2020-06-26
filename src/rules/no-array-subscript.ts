import type { RuleModule } from "@typescript-eslint/experimental-utils/dist/ts-eslint";
import {
  ESLintUtils,
  AST_NODE_TYPES,
  TSESTree,
} from "@typescript-eslint/experimental-utils";
import { isTupleTypeReference } from "tsutils";
import ts from "typescript";

/**
 * An ESLint rule to ban unsafe usage of the array/object index operator, which is not well-typed in TypeScript.
 * @see https://github.com/Microsoft/TypeScript/issues/13778
 */
const noArraySubscript: RuleModule<"errorStringGeneric", readonly []> = {
  meta: {
    type: "problem",
    docs: {
      category: "Possible Errors",
      description:
        "Array and object subscript access are not type-safe in TypeScript.",
      recommended: "error",
      url: "https://github.com/danielnixon/eslint-plugin-total-functions",
    },
    messages: {
      errorStringGeneric:
        "This subscript access is not type-safe in TypeScript.",
    },
    schema: [],
  },
  create: (context) => {
    // eslint-disable-next-line total-functions/no-unsafe-assignment
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();

    const reportUnsafeSubscriptAccess = (
      node: TSESTree.MemberExpression | TSESTree.OptionalMemberExpression
      // eslint-disable-next-line functional/no-return-void, sonarjs/cognitive-complexity
    ): void => {
      // eslint-disable-next-line functional/no-conditional-statement
      if (!node.computed) {
        // Allow non-computed (regular) property access.
        return;
      }

      // eslint-disable-next-line functional/no-conditional-statement
      if (
        node.parent !== undefined &&
        node.parent.type === AST_NODE_TYPES.TSAsExpression
      ) {
        const typeAnnotationNode = parserServices.esTreeNodeToTSNodeMap.get(
          node.parent.typeAnnotation
        );
        const typeAnnotationType = checker.getTypeAtLocation(
          typeAnnotationNode
        );

        // eslint-disable-next-line functional/no-conditional-statement
        if (
          typeAnnotationType.isUnion() &&
          typeAnnotationType.types.some((t) => t.flags & ts.TypeFlags.Undefined)
        ) {
          // We've annotated the array access with a type annotation that forces
          // the result to include undefined.
          return;
        }
      }

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

      const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node.object);
      const type = checker.getTypeAtLocation(tsNode);

      // eslint-disable-next-line functional/no-conditional-statement
      if (
        node.parent !== undefined &&
        node.parent.type === AST_NODE_TYPES.VariableDeclarator &&
        node.parent.id.typeAnnotation !== undefined
      ) {
        const typeAnnotationNode = parserServices.esTreeNodeToTSNodeMap.get(
          node.parent.id.typeAnnotation.typeAnnotation
        );
        const typeAnnotationType = checker.getTypeAtLocation(
          typeAnnotationNode
        );

        // eslint-disable-next-line functional/no-conditional-statement
        if (
          typeAnnotationType.isUnion() &&
          typeAnnotationType.types.some((t) => t.flags & ts.TypeFlags.Undefined)
        ) {
          // We're using the result of the array access to initialise something
          // that happens to include undefined, so we can ignore the partiality.
          return;
        }
      }

      // eslint-disable-next-line functional/no-conditional-statement
      if (
        node.parent !== undefined &&
        node.parent.type === AST_NODE_TYPES.AssignmentExpression &&
        node.parent.right === node
      ) {
        const leftNode = parserServices.esTreeNodeToTSNodeMap.get(
          node.parent.left
        );
        const leftType = checker.getTypeAtLocation(leftNode);

        // eslint-disable-next-line functional/no-conditional-statement
        if (
          leftType.isUnion() &&
          leftType.types.some((t) => t.flags & ts.TypeFlags.Undefined)
        ) {
          // We're assigning the result of the array access to something that happens
          // to include undefined, so we can ignore the partiality.
          return;
        }
      }

      const numberIndexType = type.getNumberIndexType();
      // eslint-disable-next-line functional/no-conditional-statement
      if (numberIndexType !== undefined) {
        const typeParts = numberIndexType.isUnion()
          ? numberIndexType.types
          : [numberIndexType];
        // eslint-disable-next-line functional/no-conditional-statement
        if (typeParts.some((t) => t.flags & ts.TypeFlags.Undefined)) {
          // Allow subscript access if undefined is already in the array type.
          return;
        }
      }

      // eslint-disable-next-line functional/no-conditional-statement
      if (
        isTupleTypeReference(type) &&
        node.property.type === AST_NODE_TYPES.Literal &&
        typeof node.property.value === "number" &&
        node.property.value <= type.target.minLength
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
        // Allow object subscript access when there is no index signature in the object (i.e. when this object is not a Record<A, B>).
        // If this access is invalid TypeScript itself will catch it.
        return;
      }

      // TODO: https://github.com/danielnixon/eslint-plugin-total-functions/issues/11

      // eslint-disable-next-line functional/no-expression-statement
      context.report({
        node: node,
        messageId: "errorStringGeneric",
      });
    };

    return {
      // eslint-disable-next-line functional/no-return-void
      OptionalMemberExpression: (node): void => {
        return reportUnsafeSubscriptAccess(node);
      },
      // eslint-disable-next-line functional/no-return-void
      MemberExpression: (node): void => {
        return reportUnsafeSubscriptAccess(node);
      },
    };
  },
};

export default noArraySubscript;
