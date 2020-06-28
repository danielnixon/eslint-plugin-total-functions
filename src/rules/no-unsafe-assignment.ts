import { RuleModule } from "@typescript-eslint/experimental-utils/dist/ts-eslint";
import {
  ESLintUtils,
  AST_NODE_TYPES,
} from "@typescript-eslint/experimental-utils";
import { isObjectType, isPropertyReadonlyInType } from "tsutils";
import { get } from "total-functions";
import { Type, SyntaxKind } from "typescript";

type MessageId =
  | "errorStringCallExpressionReadonlyToMutable"
  | "errorStringAssignmentExpressionReadonlyToMutable"
  | "errorStringVariableDeclarationReadonlyToMutable";

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
    },
    schema: [],
  },
  create: (context) => {
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();

    const isUnsafeAssignment = (
      destinationType: Type,
      sourceType: Type,
      seenTypes: ReadonlyArray<{
        readonly destinationType: Type;
        readonly sourceType: Type;
      }> = []
      // eslint-disable-next-line sonarjs/cognitive-complexity
    ): boolean => {
      // eslint-disable-next-line functional/no-conditional-statement
      if (
        // TODO what if the source type is a union that contains a mix of mutable and readonly types?
        !sourceType.isUnion() &&
        // TODO what if the destination type is a union that contains a mix of mutable and readonly types?
        // If the source type is mutable and corresponds to the (safe) mutable destination type, this will still be flagged
        // as unsafe (due to the readonly portion of the destination type union).
        !destinationType.isUnion() &&
        isObjectType(sourceType) &&
        isObjectType(destinationType)
      ) {
        // TODO this needs to check arrays too (the array itself being readonly AND its generic type being readonly)
        // TODO how to handle tuples?
        return destinationType.getProperties().some((destinationProperty) => {
          const destinationPropIsReadonly = isPropertyReadonlyInType(
            destinationType,
            destinationProperty.getEscapedName(),
            checker
          );

          const sourceProperty = sourceType.getProperty(
            destinationProperty.name
          );

          const sourcePropIsReadonly =
            sourceProperty !== undefined &&
            isPropertyReadonlyInType(
              sourceType,
              sourceProperty.getEscapedName(),
              checker
            );

          const destinationPropertyDeclarations =
            destinationProperty.getDeclarations() || [];
          // TODO: How to choose declaration when there are multiple? `checker.getResolvedSignature()`?
          const destinationPropertyDeclaration =
            destinationPropertyDeclarations.length > 1
              ? undefined
              : get(destinationPropertyDeclarations, 0);
          const destinationPropertyType =
            destinationPropertyDeclaration !== undefined
              ? checker.getTypeAtLocation(destinationPropertyDeclaration)
              : undefined;

          const sourcePropertyDeclarations =
            sourceProperty === undefined
              ? []
              : sourceProperty.getDeclarations() || [];
          // TODO: How to choose declaration when there are multiple? `checker.getResolvedSignature()`?
          const sourcePropertyDeclaration =
            sourcePropertyDeclarations.length > 1
              ? undefined
              : get(sourcePropertyDeclarations, 0);
          const sourcePropertyType =
            sourcePropertyDeclaration !== undefined
              ? checker.getTypeAtLocation(sourcePropertyDeclaration)
              : undefined;

          const destinationNumberIndexType =
            destinationPropertyType !== undefined
              ? destinationPropertyType.getNumberIndexType()
              : undefined;
          const sourceNumberIndexType =
            sourcePropertyType !== undefined
              ? sourcePropertyType.getNumberIndexType()
              : undefined;

          const isUnsafeArrayGenericType =
            destinationNumberIndexType !== undefined &&
            sourceNumberIndexType !== undefined &&
            // Try to avoid infinite recursion...
            seenTypes.every(
              (t) =>
                t.destinationType !== destinationNumberIndexType &&
                t.sourceType !== sourceNumberIndexType
            ) &&
            isUnsafeAssignment(
              destinationNumberIndexType,
              sourceNumberIndexType,
              seenTypes.concat([{ destinationType, sourceType }])
            );

          const isUnsafeAssignmentRecursively =
            destinationPropertyType !== undefined &&
            sourcePropertyType !== undefined &&
            // Try to avoid infinite recursion...
            seenTypes.every(
              (t) =>
                t.destinationType !== destinationPropertyType &&
                t.sourceType !== sourcePropertyType
            ) &&
            isUnsafeAssignment(
              destinationPropertyType,
              sourcePropertyType,
              seenTypes.concat([{ destinationType, sourceType }])
            );

          const assigningReadonlyToMutable =
            sourcePropIsReadonly && !destinationPropIsReadonly;
          return (
            assigningReadonlyToMutable ||
            isUnsafeArrayGenericType ||
            isUnsafeAssignmentRecursively
          );
        });
      } else {
        return false;
      }
    };

    return {
      // eslint-disable-next-line functional/no-return-void
      VariableDeclaration: (node): void => {
        // eslint-disable-next-line functional/no-expression-statement
        node.declarations.forEach((declaration) => {
          const leftTsNode = parserServices.esTreeNodeToTSNodeMap.get(
            declaration.id
          );
          const rightTsNode =
            declaration.init !== null
              ? parserServices.esTreeNodeToTSNodeMap.get(declaration.init)
              : undefined;

          const leftType = checker.getTypeAtLocation(leftTsNode);
          const rightType =
            rightTsNode !== undefined
              ? checker.getTypeAtLocation(rightTsNode)
              : undefined;

          // eslint-disable-next-line functional/no-conditional-statement
          if (
            declaration.init !== null &&
            rightType !== undefined &&
            // object expressions are allowed because we won't retain a reference to the object to get out of sync.
            // TODO but what about properties in the object literal that are references to values we _do_ retain a reference to?
            declaration.init.type !== AST_NODE_TYPES.ObjectExpression &&
            isUnsafeAssignment(leftType, rightType)
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
          // object expressions are allowed because we won't retain a reference to the object to get out of sync.
          // TODO but what about properties in the object literal that are references to values we _do_ retain a reference to?
          node.right.type !== AST_NODE_TYPES.ObjectExpression &&
          isUnsafeAssignment(leftType, rightType)
        ) {
          // eslint-disable-next-line functional/no-expression-statement
          context.report({
            node: node,
            messageId: "errorStringAssignmentExpressionReadonlyToMutable",
          });
        }
      },
      // TODO
      // eslint-disable-next-line functional/no-return-void
      // ReturnStatement: (node): void => {
      // },
      // // eslint-disable-next-line functional/no-return-void
      // ArrowFunctionExpression: (node): void => {
      // },
      // eslint-disable-next-line functional/no-return-void, sonarjs/cognitive-complexity
      CallExpression: (node): void => {
        const callExpressionNode = parserServices.esTreeNodeToTSNodeMap.get(
          node
        );
        const signature = checker.getResolvedSignature(callExpressionNode);
        const parameters = signature !== undefined ? signature.parameters : [];
        const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node.callee);

        // eslint-disable-next-line functional/no-expression-statement
        node.arguments.forEach((argument, i) => {
          // This is the argument that corresponds to the current parameter.
          const parameter = get(parameters, i);

          // eslint-disable-next-line functional/no-conditional-statement
          if (parameter === undefined) {
            // TODO: if we're deal with a rest parameter here we need to go back and get the last parameter.
            return;
          }

          const rawParamType = checker.getTypeOfSymbolAtLocation(
            parameter,
            tsNode
          );

          const numberIndexType = rawParamType.getNumberIndexType();

          const isRestParam =
            // TODO: work out which declaration applies in this case.
            // For now we just conclude that is a rest param if it's a rest param in _all_ declarations.
            parameter.declarations.every((d) => d.kind & SyntaxKind.RestType) &&
            numberIndexType !== undefined;

          const paramType = isRestParam ? numberIndexType : rawParamType;

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
            paramType !== undefined &&
            isUnsafeAssignment(paramType, argumentType)
          ) {
            // eslint-disable-next-line functional/no-expression-statement
            context.report({
              node: argument,
              messageId: "errorStringCallExpressionReadonlyToMutable",
            });
          }
        });
      },
    };
  },
};

export default noUnsafeAssignment;
