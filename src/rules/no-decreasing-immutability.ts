/* eslint-disable functional/prefer-immutable-types */
import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";
import ts from "typescript";
import { createRule } from "./common";
import {
  getTypeImmutability,
  Immutability,
  isUnknown,
} from "is-immutable-type";

/**
 * An ESLint rule to ban decreasing the immutability level, as determined by https://github.com/RebeccaStevens/is-immutable-type#definitions.
 */
// eslint-disable-next-line total-functions/no-unsafe-readonly-mutable-assignment
const noDecreasingImmutability = createRule({
  name: "no-decreasing-immutability",
  meta: {
    type: "problem",
    docs: {
      description: "Forbids decreasing the immutability level.",
      recommended: "error",
    },
    messages: {
      errorStringGeneric:
        'Do not decrease the immutability level of a value from "{{ sourceImmutability }}"" to "{{ destinationImmutability }}".',
    },
    schema: [],
  },
  create: (context) => {
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();

    type Violation = {
      readonly sourceImmutability: string | undefined;
      readonly destinationImmutability: string | undefined;
    };

    const decreasingImmutabilityViolation = (
      checker: ts.TypeChecker,
      destination: Readonly<ts.Type>,
      source: Readonly<ts.Type>
    ): Violation | undefined => {
      const destinationImmutability = getTypeImmutability(checker, destination);
      const sourceImmutability = getTypeImmutability(checker, source);

      // eslint-disable-next-line total-functions/no-unsafe-mutable-readonly-assignment
      return isUnknown(destinationImmutability) ||
        isUnknown(sourceImmutability) ||
        destinationImmutability >= sourceImmutability
        ? undefined
        : {
            destinationImmutability: Immutability[destinationImmutability],
            sourceImmutability: Immutability[sourceImmutability],
          };
    };

    const reportViolation = (
      checker: ts.TypeChecker,
      destination: Readonly<ts.Type>,
      source: Readonly<ts.Type>,
      node: TSESTree.Node | TSESTree.Token
      // eslint-disable-next-line functional/no-return-void
    ): void => {
      const maybeViolation = decreasingImmutabilityViolation(
        checker,
        destination,
        source
      );

      // eslint-disable-next-line functional/no-conditional-statements
      if (maybeViolation !== undefined) {
        // eslint-disable-next-line functional/no-expression-statements
        context.report({
          node: node,
          messageId: "errorStringGeneric",
          data: maybeViolation,
        } as const);
      }
    };

    return {
      // eslint-disable-next-line functional/no-return-void
      AssignmentExpression: (node): void => {
        const leftTsNode = parserServices.esTreeNodeToTSNodeMap.get(node.left);
        const rightTsNode = parserServices.esTreeNodeToTSNodeMap.get(
          node.right
        );

        const leftType = checker.getTypeAtLocation(leftTsNode);
        const rightType = checker.getTypeAtLocation(rightTsNode);

        // eslint-disable-next-line functional/no-expression-statements, total-functions/no-unsafe-mutable-readonly-assignment
        reportViolation(checker, leftType, rightType, node);
      },
    };
  },
  defaultOptions: [],
} as const);

export default noDecreasingImmutability;
