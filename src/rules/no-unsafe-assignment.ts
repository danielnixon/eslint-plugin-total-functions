import { RuleModule } from "@typescript-eslint/experimental-utils/dist/ts-eslint";
import {
  ESLintUtils,
  AST_NODE_TYPES,
} from "@typescript-eslint/experimental-utils";
import { isPropertyReadonlyInType } from "tsutils";
import { get } from "total-functions";
import { Type, Symbol, IndexKind, Node } from "typescript";
import { assignableObjectPairs, TypeChecker } from "./common";

type MessageId =
  | "errorStringCallExpressionReadonlyToMutable"
  | "errorStringAssignmentExpressionReadonlyToMutable"
  | "errorStringVariableDeclarationReadonlyToMutable"
  | "errorStringArrowFunctionExpressionReadonlyToMutable"
  | "errorStringTSAsExpressionReadonlyToMutable"
  | "errorStringTSTypeAssertionReadonlyToMutable";

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
      errorStringAssignmentExpressionReadonlyToMutable:
        "Assigning a readonly type to a mutable type can lead to unexpected mutation in the readonly value.",
      errorStringVariableDeclarationReadonlyToMutable:
        "Using a readonly type to initialize a mutable type can lead to unexpected mutation in the readonly value.",
      errorStringArrowFunctionExpressionReadonlyToMutable:
        "Returning a readonly type from a function that returns a mutable type can lead to unexpected mutation in the readonly value.",
      errorStringTSAsExpressionReadonlyToMutable:
        "Asserting a readonly type to a mutable type can lead to unexpected mutation in the readonly value.",
      errorStringTSTypeAssertionReadonlyToMutable:
        "Asserting a readonly type to a mutable type can lead to unexpected mutation in the readonly value.",
    },
    schema: [],
  },
  create: (context) => {
    const parserServices = ESLintUtils.getParserServices(context);
    const checker: TypeChecker = parserServices.program.getTypeChecker();

    const isUnsafeStringIndexAssignment = (
      destinationNode: Node,
      sourceNode: Node,
      destinationType: Type,
      sourceType: Type,
      seenTypes: ReadonlyArray<{
        readonly destinationType: Type;
        readonly sourceType: Type;
      }>
    ): boolean => {
      const destinationIndexInfo = checker.getIndexInfoOfType(
        destinationType,
        IndexKind.String
      );
      const destinationTypeHasReadonlyIndexSignature =
        destinationIndexInfo !== undefined
          ? destinationIndexInfo.isReadonly
          : false;
      const sourceIndexInfo = checker.getIndexInfoOfType(
        sourceType,
        IndexKind.String
      );
      const sourceTypeHasReadonlyIndexSignature =
        sourceIndexInfo !== undefined ? sourceIndexInfo.isReadonly : false;

      const destinationStringIndexType = destinationType.getStringIndexType();
      const sourceStringIndexType = sourceType.getStringIndexType();

      // This is unsafe if...
      return (
        // we're assigning from a readonly index signature to a mutable one, or
        (sourceTypeHasReadonlyIndexSignature &&
          !destinationTypeHasReadonlyIndexSignature) ||
        // we're assigning from a readonly index type to a mutable one.
        (destinationStringIndexType !== undefined &&
          sourceStringIndexType !== undefined &&
          isUnsafeAssignment(
            destinationNode,
            sourceNode,
            destinationStringIndexType,
            sourceStringIndexType,
            checker,
            seenTypes
          ))
      );
    };

    const isUnsafeNumberIndexAssignment = (
      destinationNode: Node,
      sourceNode: Node,
      destinationType: Type,
      sourceType: Type,
      checker: TypeChecker,
      seenTypes: ReadonlyArray<{
        readonly destinationType: Type;
        readonly sourceType: Type;
      }>
    ): boolean => {
      const destinationNumberIndexType = destinationType.getNumberIndexType();
      const sourceNumberIndexType = sourceType.getNumberIndexType();

      // This is unsafe if...
      return (
        // we're assigning from a readonly index type to a mutable one.
        destinationNumberIndexType !== undefined &&
        sourceNumberIndexType !== undefined &&
        isUnsafeAssignment(
          destinationNode,
          sourceNode,
          destinationNumberIndexType,
          sourceNumberIndexType,
          checker,
          seenTypes
        )
      );
    };

    const isUnsafePropertyAssignmentRec = (
      destinationNode: Node,
      sourceNode: Node,
      // eslint-disable-next-line @typescript-eslint/ban-types
      destinationProperty: Symbol,
      // eslint-disable-next-line @typescript-eslint/ban-types
      sourceProperty: Symbol,
      checker: TypeChecker,
      seenTypes: ReadonlyArray<{
        readonly destinationType: Type;
        readonly sourceType: Type;
      }>
    ): boolean => {
      const destinationPropertyType = checker.getTypeOfSymbolAtLocation(
        destinationProperty,
        destinationNode
      );
      const sourcePropertyType = checker.getTypeOfSymbolAtLocation(
        sourceProperty,
        sourceNode
      );

      return isUnsafeAssignment(
        destinationNode,
        sourceNode,
        destinationPropertyType,
        sourcePropertyType,
        checker,
        seenTypes
      );
    };

    const isUnsafePropertyAssignment = (
      destinationNode: Node,
      sourceNode: Node,
      destinationType: Type,
      sourceType: Type,
      checker: TypeChecker,
      seenTypes: ReadonlyArray<{
        readonly destinationType: Type;
        readonly sourceType: Type;
      }>
    ): boolean => {
      return destinationType.getProperties().some((destinationProperty) => {
        const sourceProperty = sourceType.getProperty(destinationProperty.name);

        // eslint-disable-next-line functional/no-conditional-statement
        if (sourceProperty === undefined) {
          return false;
        }

        const destinationPropIsReadonly = isPropertyReadonlyInType(
          destinationType,
          destinationProperty.getEscapedName(),
          checker
        );

        const sourcePropIsReadonly = isPropertyReadonlyInType(
          sourceType,
          sourceProperty.getEscapedName(),
          checker
        );

        // eslint-disable-next-line functional/no-conditional-statement
        if (sourcePropIsReadonly && !destinationPropIsReadonly) {
          return true;
        }

        const nextSeenTypes = seenTypes.concat({ destinationType, sourceType });

        return isUnsafePropertyAssignmentRec(
          destinationNode,
          sourceNode,
          destinationProperty,
          sourceProperty,
          checker,
          nextSeenTypes
        );
      });
    };

    const isUnsafeAssignment = (
      destinationNode: Node,
      sourceNode: Node,
      rawDestinationType: Type,
      rawSourceType: Type,
      checker: TypeChecker,
      seenTypes: ReadonlyArray<{
        readonly destinationType: Type;
        readonly sourceType: Type;
      }> = []
    ): boolean => {
      const typePairs = assignableObjectPairs(
        rawDestinationType,
        rawSourceType,
        checker
      );

      return typePairs.some(({ sourceType, destinationType }) => {
        const nextSeenTypes = seenTypes.concat({ destinationType, sourceType });

        // TODO this needs to compare function return types for readonly -> mutable
        // This is an unsafe assignment if...
        return (
          // we're not in an infinitely recursive type,
          seenTypes.every(
            (t) =>
              t.destinationType !== destinationType &&
              t.sourceType !== sourceType
          ) &&
          // and the types we're assigning from and to are different,
          // TODO this seems to be required to prevent a hang in https://github.com/oaf-project/oaf-react-router
          // Need to work out why and formulate a test to reproduce
          destinationType !== sourceType &&
          // and we're either:
          // assigning from a type with readonly string index type to one with a mutable string index type, or
          (isUnsafeStringIndexAssignment(
            destinationNode,
            sourceNode,
            destinationType,
            sourceType,
            nextSeenTypes
          ) ||
            // assigning from a type with readonly number index type to one with a mutable number index type, or
            isUnsafeNumberIndexAssignment(
              destinationNode,
              sourceNode,
              destinationType,
              sourceType,
              checker,
              nextSeenTypes
            ) ||
            // assigning from a type with one or more readonly properties to one with one or more mutable properties with the same name(s).
            isUnsafePropertyAssignment(
              destinationNode,
              sourceNode,
              destinationType,
              sourceType,
              checker,
              nextSeenTypes
            ))
        );
      });
    };

    return {
      // eslint-disable-next-line functional/no-return-void
      TSTypeAssertion: (node): void => {
        // eslint-disable-next-line functional/no-conditional-statement
        if (
          node.typeAnnotation.type === AST_NODE_TYPES.TSTypeReference &&
          node.typeAnnotation.typeName.type === AST_NODE_TYPES.Identifier &&
          node.typeAnnotation.typeName.name === "const"
        ) {
          // Always allow `as const`.
          return;
        }

        const destinationNode = parserServices.esTreeNodeToTSNodeMap.get(node);
        const destinationType = checker.getTypeAtLocation(destinationNode);
        const sourceNode = destinationNode.expression;
        const sourceType = checker.getTypeAtLocation(sourceNode);

        // eslint-disable-next-line functional/no-conditional-statement
        if (
          isUnsafeAssignment(
            destinationNode,
            sourceNode,
            destinationType,
            sourceType,
            checker
          )
        ) {
          // eslint-disable-next-line functional/no-expression-statement
          context.report({
            node: node,
            messageId: "errorStringTSTypeAssertionReadonlyToMutable",
          });
        }
      },
      // eslint-disable-next-line functional/no-return-void
      TSAsExpression: (node): void => {
        // eslint-disable-next-line functional/no-conditional-statement
        if (
          node.typeAnnotation.type === AST_NODE_TYPES.TSTypeReference &&
          node.typeAnnotation.typeName.type === AST_NODE_TYPES.Identifier &&
          node.typeAnnotation.typeName.name === "const"
        ) {
          // Always allow `as const`.
          return;
        }

        const destinationNode = parserServices.esTreeNodeToTSNodeMap.get(node);
        const destinationType = checker.getTypeAtLocation(destinationNode);
        const sourceNode = destinationNode.expression;
        const sourceType = checker.getTypeAtLocation(sourceNode);

        // eslint-disable-next-line functional/no-conditional-statement
        if (
          isUnsafeAssignment(
            destinationNode,
            sourceNode,
            destinationType,
            sourceType,
            checker
          )
        ) {
          // eslint-disable-next-line functional/no-expression-statement
          context.report({
            node: node,
            messageId: "errorStringTSAsExpressionReadonlyToMutable",
          });
        }
      },
      // eslint-disable-next-line functional/no-return-void
      VariableDeclaration: (node): void => {
        // eslint-disable-next-line functional/no-expression-statement
        node.declarations.forEach((declaration) => {
          // eslint-disable-next-line functional/no-conditional-statement
          if (
            declaration.id.type === AST_NODE_TYPES.Identifier &&
            declaration.id.typeAnnotation === undefined
          ) {
            // If there is no type annotation then there's no risk of assigning mutable to readonly.
            return;
          }

          // eslint-disable-next-line functional/no-conditional-statement
          if (declaration.init === null) {
            // If there is no initial value then there's no risk of assigning mutable to readonly.
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

          // eslint-disable-next-line functional/no-conditional-statement
          if (
            isUnsafeAssignment(
              leftTsNode,
              rightTsNode,
              leftType,
              rightType,
              checker
            )
          ) {
            // eslint-disable-next-line functional/no-expression-statement
            context.report({
              node: node,
              messageId: "errorStringVariableDeclarationReadonlyToMutable",
            });
          }
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

        // eslint-disable-next-line functional/no-conditional-statement
        if (
          isUnsafeAssignment(
            leftTsNode,
            rightTsNode,
            leftType,
            rightType,
            checker
          )
        ) {
          // eslint-disable-next-line functional/no-expression-statement
          context.report({
            node: node,
            messageId: "errorStringAssignmentExpressionReadonlyToMutable",
          });
        }
      },
      // eslint-disable-next-line functional/no-return-void
      ReturnStatement: (node): void => {
        const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);

        // eslint-disable-next-line functional/no-conditional-statement
        if (tsNode.expression === undefined) {
          return;
        }

        const destinationType = checker.getContextualType(tsNode.expression);
        const sourceType = checker.getTypeAtLocation(tsNode.expression);

        // eslint-disable-next-line functional/no-conditional-statement
        if (
          destinationType !== undefined &&
          isUnsafeAssignment(
            tsNode.expression,
            tsNode.expression,
            destinationType,
            sourceType,
            checker
          )
        ) {
          // eslint-disable-next-line functional/no-expression-statement
          context.report({
            node: node,
            messageId: "errorStringArrowFunctionExpressionReadonlyToMutable",
          });
        }
      },
      // TODO: YieldExpression?
      // eslint-disable-next-line functional/no-return-void
      ArrowFunctionExpression: (node): void => {
        // eslint-disable-next-line functional/no-conditional-statement
        if (node.returnType === undefined) {
          return;
        }
        const destinationNode = parserServices.esTreeNodeToTSNodeMap.get(
          node.returnType.typeAnnotation
        );
        const destinationType = checker.getTypeAtLocation(destinationNode);
        const sourceNode = parserServices.esTreeNodeToTSNodeMap.get(node.body);
        const sourceType = checker.getTypeAtLocation(sourceNode);

        // eslint-disable-next-line functional/no-conditional-statement
        if (
          isUnsafeAssignment(
            destinationNode,
            sourceNode,
            destinationType,
            sourceType,
            checker
          )
        ) {
          // eslint-disable-next-line functional/no-expression-statement
          context.report({
            node: node.body,
            messageId: "errorStringArrowFunctionExpressionReadonlyToMutable",
          });
        }
      },
      // eslint-disable-next-line functional/no-return-void
      CallExpression: (node): void => {
        const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);

        // eslint-disable-next-line functional/no-expression-statement
        tsNode.arguments.forEach((argument, i) => {
          const argumentType = checker.getTypeAtLocation(argument);
          const paramType = checker.getContextualType(argument);

          // eslint-disable-next-line functional/no-conditional-statement
          if (
            paramType !== undefined &&
            isUnsafeAssignment(
              argument,
              argument,
              paramType,
              argumentType,
              checker
            )
          ) {
            // eslint-disable-next-line functional/no-expression-statement
            context.report({
              node: get(node.arguments, i) ?? node,
              messageId: "errorStringCallExpressionReadonlyToMutable",
            });
          }
        });
      },
    };
  },
};

export default noUnsafeAssignment;
