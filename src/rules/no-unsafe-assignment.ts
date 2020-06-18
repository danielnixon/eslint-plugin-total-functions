import { RuleModule } from "@typescript-eslint/experimental-utils/dist/ts-eslint";
import {
  ESLintUtils,
  AST_NODE_TYPES,
} from "@typescript-eslint/experimental-utils";
import { isObjectType, isPropertyReadonlyInType } from "tsutils";
import { get } from "total-functions";

/**
 * An ESLint rule to ban unsafe assignment and declarations.
 */
const noUnsafeAssignment: RuleModule<
  "errorStringCallExpression",
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
      errorStringCallExpression: "This call can lead to type-safety issues.",
    },
    schema: [],
  },
  create: (context) => {
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();

    return {
      // TODO
      // // eslint-disable-next-line functional/no-return-void
      // VariableDeclaration: (node): void => {
      // },
      // // eslint-disable-next-line functional/no-return-void
      // AssignmentExpression: (node): void => {
      // },
      // eslint-disable-next-line functional/no-return-void
      // ReturnStatement: (node): void => {
      // },
      // // eslint-disable-next-line functional/no-return-void
      // ArrowFunctionExpression: (node): void => {
      // },
      // eslint-disable-next-line functional/no-return-void, sonarjs/cognitive-complexity
      CallExpression: (node): void => {
        const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node.callee);
        const tsType = checker.getTypeAtLocation(tsNode);
        const signatures = tsType.getCallSignatures();

        // TODO: if a function has more than one signature, how do we know which
        // one applies for this call?
        const signature = get(signatures, 0);

        // eslint-disable-next-line functional/no-conditional-statement
        if (signatures.length === 1 && signature !== undefined) {
          // eslint-disable-next-line functional/no-expression-statement
          signature.parameters.forEach((parameter, i) => {
            const paramType = checker.getTypeOfSymbolAtLocation(
              parameter,
              tsNode
            );

            // This is the argument that corresponds to the current parameter.
            const argument = get(node.arguments, i);
            const argumentTsNode =
              argument !== undefined
                ? parserServices.esTreeNodeToTSNodeMap.get(argument)
                : undefined;
            const argumentType =
              argumentTsNode !== undefined
                ? checker.getTypeAtLocation(argumentTsNode)
                : undefined;

            // eslint-disable-next-line functional/no-conditional-statement
            if (
              argument !== undefined &&
              argumentType !== undefined &&
              isObjectType(argumentType) &&
              isObjectType(paramType) &&
              // object expressions are allowed because we won't retain a reference to the object to get out of sync.
              argument.type !== AST_NODE_TYPES.ObjectExpression
            ) {
              // eslint-disable-next-line functional/no-expression-statement
              paramType.getProperties().forEach((property) => {
                const parameterPropIsReadonly = isPropertyReadonlyInType(
                  paramType,
                  property.escapedName,
                  checker
                );

                const argumentPropsIsReadonly = isPropertyReadonlyInType(
                  argumentType,
                  property.escapedName,
                  checker
                );

                const oneMutableOneReadonly =
                  argumentPropsIsReadonly !== parameterPropIsReadonly;

                const bothMutableButDifferentTypes =
                  !argumentPropsIsReadonly &&
                  !parameterPropIsReadonly &&
                  argumentType !== paramType;

                // eslint-disable-next-line functional/no-conditional-statement
                if (oneMutableOneReadonly || bothMutableButDifferentTypes) {
                  // eslint-disable-next-line functional/no-expression-statement
                  context.report({
                    node: argument,
                    messageId: "errorStringCallExpression",
                  });
                }
              });
            }
          });
        }
      },
    };
  },
};

export default noUnsafeAssignment;
