import { RuleModule } from "@typescript-eslint/experimental-utils/dist/ts-eslint";
import {
  ESLintUtils,
  AST_NODE_TYPES,
  TSESTree,
} from "@typescript-eslint/experimental-utils";
import { isObjectType, isPropertyReadonlyInType } from "tsutils";
import { get } from "total-functions";
import { Type } from "typescript";

type MessageId = "errorStringCallExpressionReadonlyToMutable";

/**
 * An ESLint rule to ban unsafe assignment and declarations.
 */
const noUnsafeAssignment: RuleModule<MessageId, readonly []> = {
  meta: {
    type: "problem",
    docs: {
      category: "Possible Errors",
      description: "Bans unsafe type assertions.",
      recommended: "error",
      url: "https://github.com/danielnixon/eslint-plugin-total-functions",
    },
    messages: {
      errorStringCallExpressionReadonlyToMutable:
        "Passing a readonly type to a function that expects a mutable type can lead to unexpected mutation in the readonly value.",
    },
    schema: [],
  },
  create: (context) => {
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();

    const reportIfUnsafeAssignment = (
      node: TSESTree.Node,
      messageId: MessageId,
      destinationType: Type,
      sourceType: Type
      // eslint-disable-next-line functional/no-return-void
    ): void => {
      // eslint-disable-next-line functional/no-conditional-statement
      if (isObjectType(sourceType) && isObjectType(destinationType)) {
        // TODO this needs to check arrays too (the array itself being readonly AND its generic type being readonly)
        // TODO how to handle tuples?
        const assigningReadonlyToMutable = destinationType
          .getProperties()
          .some((parameterProperty) => {
            const parameterPropIsReadonly = isPropertyReadonlyInType(
              destinationType,
              parameterProperty.getEscapedName(),
              checker
            );

            const argumentProperty = sourceType.getProperty(
              parameterProperty.name
            );

            const argumentPropIsReadonly =
              argumentProperty !== undefined &&
              isPropertyReadonlyInType(
                sourceType,
                argumentProperty.getEscapedName(),
                checker
              );

            // TODO this needs to recursively check objects and arrays.
            // For arrays we need to check the array itself being readonly AND its generic type being readonly.

            return argumentPropIsReadonly && !parameterPropIsReadonly;
          });

        // eslint-disable-next-line functional/no-conditional-statement
        if (assigningReadonlyToMutable) {
          // eslint-disable-next-line functional/no-expression-statement
          context.report({
            node,
            messageId,
          });
        }
      }
    };

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
        // one applies for this call? `checker.getResolvedSignature()`?
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
              // object expressions are allowed because we won't retain a reference to the object to get out of sync.
              // TODO but what about properties in the object literal that are references to values we _do_ retain a reference to?
              argument.type !== AST_NODE_TYPES.ObjectExpression &&
              // TODO what if the argument type is a union that contains a mix of mutable and readonly types?
              !argumentType.isUnion() &&
              // TODO what if the parameter type is a union that contains a mix of mutable and readonly types?
              // If the argument type is mutable and corresponds to the (safe) mutable parameter type, this will still be flagged
              // as unsafe (due to the readonly portion of the parameter type union).
              !paramType.isUnion()
            ) {
              // eslint-disable-next-line functional/no-expression-statement
              reportIfUnsafeAssignment(
                argument,
                "errorStringCallExpressionReadonlyToMutable",
                paramType,
                argumentType
              );
            }
          });
        }
      },
    };
  },
};

export default noUnsafeAssignment;
