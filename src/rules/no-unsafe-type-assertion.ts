import { RuleModule } from "@typescript-eslint/experimental-utils/dist/ts-eslint";
import {
  AST_NODE_TYPES,
  ESLintUtils,
} from "@typescript-eslint/experimental-utils";
import { unionTypeParts } from "tsutils";
import ts from "typescript";
import { filterTypes, symbolToType } from "./common";

/**
 * An ESLint rule to ban unsafe type assertions.
 */
const noUnsafeTypeAssertion: RuleModule<
  "errorStringGeneric" | "errorStringPreferAs",
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
      errorStringGeneric: "This type assertion is not type-safe.",
      errorStringPreferAs: "Use the 'as' syntax for type assertions.",
    },
    schema: [],
  },
  create: (context) => {
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();

    const isUnsafe = (
      rawDestinationType: ts.Type,
      rawSourceType: ts.Type,
      seenTypes: ReadonlyArray<{
        readonly destinationType: ts.Type;
        readonly sourceType: ts.Type;
      }> = []
    ): boolean => {
      const { destinationType, sourceType } = filterTypes(
        rawDestinationType,
        rawSourceType
      );

      // eslint-disable-next-line functional/no-conditional-statement
      if (destinationType === undefined || sourceType === undefined) {
        return false;
      }

      return destinationType.getProperties().every((destinationProperty) => {
        const destinationPropertyType = symbolToType(
          destinationProperty,
          checker
        );
        const sourceProperty = sourceType.getProperty(destinationProperty.name);
        const sourcePropertyType =
          sourceProperty !== undefined
            ? symbolToType(sourceProperty, checker)
            : undefined;

        const destinationPropertyIsOptional =
          destinationProperty.flags & ts.SymbolFlags.Optional;

        const destinationTypeParts =
          destinationPropertyType !== undefined
            ? unionTypeParts(destinationPropertyType)
            : [];
        const destinationPropertyAllowsUndefined = destinationTypeParts.some(
          (t) => t.flags & ts.TypeFlags.Undefined
        );

        const sourcePropertyIsUndefined =
          sourcePropertyType === undefined ||
          unionTypeParts(sourcePropertyType).some(
            (t) => t.flags & ts.TypeFlags.Undefined
          );

        const nextSeenTypes = seenTypes.concat([
          { destinationType, sourceType },
        ]);

        const isUnsafePropertyAssignment =
          sourcePropertyIsUndefined &&
          !destinationPropertyAllowsUndefined &&
          !destinationPropertyIsOptional;

        // This is an unsafe assignment if...
        return (
          // we're not in an infinitely recursive type,
          seenTypes.every(
            (t) =>
              t.destinationType !== destinationType &&
              t.sourceType !== sourceType
          ) &&
          // and this is an unsafe property assignment, or
          (isUnsafePropertyAssignment ||
            // this is unsafe recursively
            (destinationPropertyType !== undefined &&
              sourcePropertyType !== undefined &&
              isUnsafe(
                destinationPropertyType,
                sourcePropertyType,
                nextSeenTypes
              )))
        );
      });
    };

    return {
      // eslint-disable-next-line functional/no-return-void
      TSTypeAssertion: (node): void => {
        // This is the deprecated style so always error.

        // eslint-disable-next-line functional/no-expression-statement
        context.report({
          node: node,
          messageId: "errorStringPreferAs",
        });
      },
      // eslint-disable-next-line functional/no-return-void
      TSAsExpression: (node): void => {
        // eslint-disable-next-line functional/no-conditional-statement
        if (node.typeAnnotation.type === AST_NODE_TYPES.TSAnyKeyword) {
          // Always allow `as any`. Other rules will catch it.
          return;
        }

        // eslint-disable-next-line functional/no-conditional-statement
        if (node.typeAnnotation.type === AST_NODE_TYPES.TSUnknownKeyword) {
          // Always allow `as unknown`.
          return;
        }

        // eslint-disable-next-line functional/no-conditional-statement
        if (
          node.typeAnnotation.type === AST_NODE_TYPES.TSTypeReference &&
          node.typeAnnotation.typeName.type === AST_NODE_TYPES.Identifier &&
          node.typeAnnotation.typeName.name === "const"
        ) {
          // Always allow `as const`.
          return;
        }

        // The right hand side of the "as".
        const destinationNode = parserServices.esTreeNodeToTSNodeMap.get(node);
        const rawDestinationType = checker.getTypeAtLocation(destinationNode);

        // The left hand side of the "as".
        const sourceNode = destinationNode.expression;
        const rawSourceType = checker.getTypeAtLocation(sourceNode);

        // eslint-disable-next-line functional/no-conditional-statement
        if (isUnsafe(rawDestinationType, rawSourceType)) {
          // eslint-disable-next-line functional/no-expression-statement
          context.report({
            node: node,
            messageId: "errorStringGeneric",
          });
        }
      },
    };
  },
};

export default noUnsafeTypeAssertion;
