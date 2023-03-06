/* eslint-disable functional/prefer-immutable-types */
import {
  AST_NODE_TYPES,
  ESLintUtils,
  TSESTree,
} from "@typescript-eslint/utils";
import { assignableTypePairs, createRule } from "./common";
import { Type, TypeChecker, TypeFlags } from "typescript";
import { isTypeFlagSet } from "@typescript-eslint/type-utils";
import { RuleContext } from "@typescript-eslint/utils/dist/ts-eslint";

const reportIfUnsafe = (
  checker: TypeChecker,
  leftType: Type,
  rightType: Type,
  context: Readonly<RuleContext<string, readonly unknown[]>>,
  node: TSESTree.Node
  // eslint-disable-next-line functional/no-return-void
): void => {
  const typePairs = assignableTypePairs(leftType, rightType, checker);

  // If the thing being assigned to is an enum but the thing being assigned is
  // not an enum, TSC permits unsafe assignment.
  const isUnsafe = typePairs.some(
    (typePair) =>
      isTypeFlagSet(typePair.destinationType, TypeFlags.EnumLike) &&
      !isTypeFlagSet(typePair.sourceType, TypeFlags.EnumLike)
  );

  // eslint-disable-next-line functional/no-conditional-statements
  if (isUnsafe) {
    // eslint-disable-next-line functional/no-expression-statements
    context.report({
      node: node,
      messageId: "errorStringGeneric",
    } as const);
  }
};

/**
 * An ESLint rule to ban unsafe enum assignments.
 */
// eslint-disable-next-line total-functions/no-unsafe-readonly-mutable-assignment
const noUnsafeEnumAssignment = createRule({
  name: "no-unsafe-enum-assignment",
  meta: {
    type: "problem",
    docs: {
      description: "Bans unsafe enum assignment.",
      recommended: "error",
    },
    messages: {
      errorStringGeneric: "This enum assignment is not type-safe.",
    },
    schema: [],
  },
  create: (context) => {
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();

    return {
      // eslint-disable-next-line functional/no-return-void
      VariableDeclaration: (node) => {
        // eslint-disable-next-line functional/no-expression-statements, functional/no-return-void
        node.declarations.forEach((declaration) => {
          // eslint-disable-next-line functional/no-conditional-statements
          if (
            declaration.id.type === AST_NODE_TYPES.Identifier &&
            declaration.id.typeAnnotation === undefined
          ) {
            // If there is no type annotation then there's no risk of unsafe assignment.
            return;
          }

          // eslint-disable-next-line functional/no-conditional-statements
          if (declaration.init === null) {
            // If there is no type annotation then there's no risk of unsafe assignment.
            return;
          }

          const leftTsNode = parserServices.esTreeNodeToTSNodeMap.get(
            declaration.id
          );
          const rightTsNode = parserServices.esTreeNodeToTSNodeMap.get(
            declaration.init
          );

          const leftType = checker.getTypeAtLocation(leftTsNode);

          const rightType = checker.getTypeAtLocation(rightTsNode);

          // eslint-disable-next-line functional/no-expression-statements
          reportIfUnsafe(checker, leftType, rightType, context, node);
        });
      },

      // eslint-disable-next-line functional/no-return-void
      AssignmentExpression: (node): void => {
        const leftTsNode = parserServices.esTreeNodeToTSNodeMap.get(node.left);
        const rightTsNode = parserServices.esTreeNodeToTSNodeMap.get(
          node.right
        );

        const leftType = checker.getTypeAtLocation(leftTsNode);
        const rightType = checker.getTypeAtLocation(rightTsNode);

        // eslint-disable-next-line functional/no-expression-statements
        reportIfUnsafe(checker, leftType, rightType, context, node);
      },
      // eslint-disable-next-line functional/no-return-void
      ReturnStatement: (node): void => {
        const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);

        // eslint-disable-next-line functional/no-conditional-statements
        if (tsNode.expression === undefined) {
          return;
        }

        const destinationType = checker.getContextualType(tsNode.expression);
        const sourceType = checker.getTypeAtLocation(tsNode.expression);

        // eslint-disable-next-line functional/no-conditional-statements
        if (destinationType !== undefined) {
          // eslint-disable-next-line functional/no-expression-statements
          reportIfUnsafe(checker, destinationType, sourceType, context, node);
        }
      },
      // eslint-disable-next-line functional/no-return-void
      YieldExpression: (node): void => {
        const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);

        // eslint-disable-next-line functional/no-conditional-statements
        if (tsNode.expression === undefined) {
          return;
        }

        const destinationType = checker.getContextualType(tsNode.expression);
        const sourceType = checker.getTypeAtLocation(tsNode.expression);

        // eslint-disable-next-line functional/no-conditional-statements
        if (destinationType !== undefined) {
          // eslint-disable-next-line functional/no-expression-statements
          reportIfUnsafe(checker, destinationType, sourceType, context, node);
        }
      },
      // eslint-disable-next-line functional/no-return-void
      ArrowFunctionExpression: (node): void => {
        // eslint-disable-next-line functional/no-conditional-statements
        if (node.returnType === undefined) {
          return;
        }
        const destinationNode = parserServices.esTreeNodeToTSNodeMap.get(
          node.returnType.typeAnnotation
        );
        // eslint-disable-next-line total-functions/no-unsafe-mutable-readonly-assignment
        const destinationType = checker.getTypeAtLocation(destinationNode);
        const sourceNode = parserServices.esTreeNodeToTSNodeMap.get(node.body);
        const sourceType = checker.getTypeAtLocation(sourceNode);

        // eslint-disable-next-line functional/no-expression-statements
        reportIfUnsafe(checker, destinationType, sourceType, context, node);
      },
      // eslint-disable-next-line functional/no-return-void
      CallExpression: (node): void => {
        const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);

        // eslint-disable-next-line functional/no-expression-statements, functional/no-return-void
        tsNode.arguments.forEach((argument) => {
          const argumentType = checker.getTypeAtLocation(argument);
          const paramType = checker.getContextualType(argument);

          // eslint-disable-next-line functional/no-conditional-statements
          if (paramType !== undefined) {
            // eslint-disable-next-line functional/no-expression-statements
            reportIfUnsafe(checker, paramType, argumentType, context, node);
          }
        });
      },
    };
  },
  defaultOptions: [],
} as const);

export default noUnsafeEnumAssignment;
