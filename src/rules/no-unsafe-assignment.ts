import { RuleModule } from "@typescript-eslint/experimental-utils/dist/ts-eslint";
import {
  ESLintUtils,
  AST_NODE_TYPES,
} from "@typescript-eslint/experimental-utils";
import { isObjectType, isPropertyReadonlyInType } from "tsutils";
import { get } from "total-functions";
import { Type, SyntaxKind, Symbol, IndexKind } from "typescript";

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

    /**
     * Throws away non-object types (string, number, boolean, etc) because we don't check those for readonly -> mutable assignment.
     */
    const filterTypes = (
      rawDestinationType: Type,
      rawSourceType: Type
    ): {
      readonly destinationType: Type | undefined;
      readonly sourceType: Type | undefined;
    } => {
      // TODO if the destination is a union containing _all_ mutable types, we're assigning to mutable.
      // TODO if the destination contains a mix of mutable and readonly types, we don't know if we're assigning
      // to mutable unless we can narrow down which destination (parameter) types apply to the given source (argument) types.
      const destinationTypes = rawDestinationType.isUnion()
        ? rawDestinationType.types
        : [rawDestinationType];
      const filteredDestinationTypes = destinationTypes.filter((t) =>
        isObjectType(t)
      );
      const destinationType =
        filteredDestinationTypes.length === 1
          ? get(filteredDestinationTypes, 0)
          : undefined;

      // TODO if the sourceType is a union containing _any_ readonly types, we're assigning from readonly.
      const sourceTypes = rawSourceType.isUnion()
        ? rawSourceType.types
        : [rawSourceType];
      const filteredSourceTypes = sourceTypes.filter((t) => isObjectType(t));
      const sourceType =
        filteredSourceTypes.length === 1
          ? get(filteredSourceTypes, 0)
          : undefined;

      return {
        destinationType,
        sourceType,
      };
    };

    const isUnsafeStringIndexAssignment = (
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
        // we're assigning from one object to another, and
        (isObjectType(destinationType) &&
          isObjectType(sourceType) &&
          // we're assigning from a readonly index signature to a mutable one, or
          sourceTypeHasReadonlyIndexSignature &&
          !destinationTypeHasReadonlyIndexSignature) ||
        // we're assigning from a readonly index type to a mutable one.
        (destinationStringIndexType !== undefined &&
          sourceStringIndexType !== undefined &&
          isUnsafeAssignment(
            destinationStringIndexType,
            sourceStringIndexType,
            seenTypes
          ))
      );
    };

    const isUnsafeNumberIndexAssignment = (
      destinationType: Type,
      sourceType: Type,
      seenTypes: ReadonlyArray<{
        readonly destinationType: Type;
        readonly sourceType: Type;
      }>
    ): boolean => {
      const destinationNumberIndexType = destinationType.getNumberIndexType();
      const sourceNumberIndexType = sourceType.getNumberIndexType();

      // This is unsafe if...
      return (
        isObjectType(destinationType) &&
        isObjectType(sourceType) &&
        // we're assigning from a readonly index type to a mutable one.
        destinationNumberIndexType !== undefined &&
        sourceNumberIndexType !== undefined &&
        isUnsafeAssignment(
          destinationNumberIndexType,
          sourceNumberIndexType,
          seenTypes
        )
      );
    };

    const isUnsafePropertyAssignmentRec = (
      // eslint-disable-next-line @typescript-eslint/ban-types
      destinationProperty: Symbol,
      // eslint-disable-next-line @typescript-eslint/ban-types
      sourceProperty: Symbol,
      seenTypes: ReadonlyArray<{
        readonly destinationType: Type;
        readonly sourceType: Type;
      }>
    ): boolean => {
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

      const sourcePropertyDeclarations = sourceProperty.getDeclarations() || [];
      // TODO: How to choose declaration when there are multiple? `checker.getResolvedSignature()`?
      const sourcePropertyDeclaration =
        sourcePropertyDeclarations.length > 1
          ? undefined
          : get(sourcePropertyDeclarations, 0);
      const sourcePropertyType =
        sourcePropertyDeclaration !== undefined
          ? checker.getTypeAtLocation(sourcePropertyDeclaration)
          : undefined;

      return (
        destinationPropertyType !== undefined &&
        sourcePropertyType !== undefined &&
        isUnsafeAssignment(
          destinationPropertyType,
          sourcePropertyType,
          seenTypes
        )
      );
    };

    const isUnsafePropertyAssignment = (
      destinationType: Type,
      sourceType: Type,
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

        const nextSeenTypes = seenTypes.concat([
          { destinationType, sourceType },
        ]);

        return isUnsafePropertyAssignmentRec(
          destinationProperty,
          sourceProperty,
          nextSeenTypes
        );
      });
    };

    const isUnsafeAssignment = (
      rawDestinationType: Type,
      rawSourceType: Type,
      seenTypes: ReadonlyArray<{
        readonly destinationType: Type;
        readonly sourceType: Type;
      }> = []
    ): boolean => {
      // TODO if rawSourceType is entirely readonly (including all member types if it's a union)
      // and rawDestinationType is entirely mutable (including all member types if it's a union)
      // (where "entirely" means all object properties, string index types, number index types and recursively)
      // then we can safely conclude this must be unsafe, report the error and return early.
      // this would catch some cases that we currently miss because they are a union type with > 1 object type member
      // (which currently gets filtered out inside `filterTypes`).

      const { destinationType, sourceType } = filterTypes(
        rawDestinationType,
        rawSourceType
      );

      const nextSeenTypes = seenTypes.concat(
        destinationType !== undefined && sourceType !== undefined
          ? [{ destinationType, sourceType }]
          : []
      );

      // This is an unsafe assignment if...
      return (
        // we're not in an infinitely recursive type,
        seenTypes.every(
          (t) =>
            t.destinationType !== destinationType && t.sourceType !== sourceType
        ) &&
        // and we statically know both the destination and the source type,
        destinationType !== undefined &&
        sourceType !== undefined &&
        // and the types we're assigning from and to are different,
        destinationType !== sourceType &&
        // and we're either:
        // assigning from a type with readonly string index type to one with a mutable string index type, or
        (isUnsafeStringIndexAssignment(
          destinationType,
          sourceType,
          nextSeenTypes
        ) ||
          // assigning from a type with readonly number index type to one with a mutable number index type, or
          isUnsafeNumberIndexAssignment(
            destinationType,
            sourceType,
            nextSeenTypes
          ) ||
          // assigning from a type with one or more readonly properties to one with one or more mutable properties with the same name(s).
          isUnsafePropertyAssignment(
            destinationType,
            sourceType,
            nextSeenTypes
          ))
      );
    };

    return {
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
            rightType !== undefined &&
            // object expressions are allowed because we won't retain a reference to the object to get out of sync.
            // TODO but what about properties in the object literal that are references to values we _do_ retain a reference to?
            declaration.init !== null &&
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
      // eslint-disable-next-line functional/no-return-void
      CallExpression: (node): void => {
        const callExpressionNode = parserServices.esTreeNodeToTSNodeMap.get(
          node
        );
        const signature = checker.getResolvedSignature(callExpressionNode);
        const parameters = signature !== undefined ? signature.parameters : [];
        const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node.callee);

        // eslint-disable-next-line functional/no-expression-statement
        node.arguments.forEach((argument, i) => {
          // This is the parameter that corresponds to the current argument.
          const parameter = get(parameters, i);

          // eslint-disable-next-line functional/no-conditional-statement
          if (parameter === undefined) {
            // TODO: if we're dealing with a rest parameter here we need to go back and get the last parameter.
            return;
          }

          const rawParamType = checker.getTypeOfSymbolAtLocation(
            parameter,
            tsNode
          );

          const numberIndexType = rawParamType.getNumberIndexType();

          // TODO: work out which declaration applies in this case.
          // For now we just conclude that this is a rest param if it's a rest param in _all_ declarations.
          const isRestParam =
            rawParamType.symbol !== undefined &&
            rawParamType.symbol.declarations.every(
              (d) => d.kind & SyntaxKind.RestType
            ) &&
            numberIndexType !== undefined;

          const paramType = isRestParam ? numberIndexType : rawParamType;

          const argumentTsNode = parserServices.esTreeNodeToTSNodeMap.get(
            argument
          );
          const argumentType = checker.getTypeAtLocation(argumentTsNode);

          // eslint-disable-next-line functional/no-conditional-statement
          if (
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
