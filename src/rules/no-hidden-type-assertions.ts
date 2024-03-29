/* eslint-disable functional/prefer-immutable-types */
import {
  isTypeNeverType,
  isTypeUnknownType,
} from "@typescript-eslint/type-utils";
import { ESLintUtils } from "@typescript-eslint/utils";
import {
  isArrayTypeNode,
  isFunctionTypeNode,
  isIntersectionTypeNode,
  isNamedTupleMember,
  isTupleTypeNode,
  isTypeLiteralNode,
  isTypeNode,
  isTypeOperatorNode,
  isUnionTypeNode,
  NodeArray,
  ParameterDeclaration,
  TypeElement,
  TypeNode,
} from "typescript";
import {
  isConditionalTypeNode,
  isIndexedAccessTypeNode,
  isTypeReferenceNode,
  SyntaxKind,
} from "typescript";
import { createRule } from "./common";

/**
 * An ESLint rule to ban hidden type assertions.
 */
// eslint-disable-next-line total-functions/no-unsafe-readonly-mutable-assignment
const noHiddenTypeAssertions = createRule({
  name: "no-hidden-type-assertions",
  meta: {
    type: "problem",
    docs: {
      description: "Bans hidden type assertions.",
      recommended: "error",
    },
    messages: {
      errorStringGeneric:
        "Do not use hidden type assertions. Specify `unknown` or `never` instead of an arbitrary type argument.",
    },
    schema: [],
  },
  create: (context) => {
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();

    const hasTypeNode = (
      typeElement: TypeElement,
    ): typeElement is TypeElement & { readonly type: TypeNode } => {
      // eslint-disable-next-line functional/no-try-statements
      try {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const typeAttr = (typeElement as Partial<{ readonly type: TypeNode }>)
          .type;
        return typeAttr !== undefined && isTypeNode(typeAttr);
      } catch {
        return false;
      }
    };

    const explodeTypeNode = (
      type: TypeNode,
      depth: number,
      // eslint-disable-next-line sonarjs/cognitive-complexity
    ): readonly TypeNode[] => {
      // TODO write a test that exercises this
      // eslint-disable-next-line functional/no-conditional-statements
      if (depth >= 100) {
        return [] as const;
      }

      const next = isTypeReferenceNode(type)
        ? type.typeArguments ?? []
        : isConditionalTypeNode(type)
        ? [type.checkType, type.trueType, type.falseType]
        : isIndexedAccessTypeNode(type)
        ? [type.objectType, type.indexType]
        : isFunctionTypeNode(type)
        ? [type.type, ...parametersToTypeNodes(type.parameters, depth)]
        : isTupleTypeNode(type)
        ? type.elements
        : isNamedTupleMember(type)
        ? [type.type]
        : isTypeLiteralNode(type)
        ? type.members.flatMap((m) => (hasTypeNode(m) ? [m.type] : []))
        : isArrayTypeNode(type)
        ? [type.elementType]
        : isTypeOperatorNode(type)
        ? [type.type]
        : isUnionTypeNode(type)
        ? type.types
        : isIntersectionTypeNode(type)
        ? type.types
        : [];

      return [type, ...next.flatMap(explodeTypeNode)] as const;
    };

    const parametersToTypeNodes = (
      parameters: NodeArray<ParameterDeclaration>,
      depth: number,
    ): readonly TypeNode[] => {
      return parameters
        .flatMap((parameter) =>
          parameter.type !== undefined ? [parameter.type] : [],
        )
        .flatMap((parameter) => explodeTypeNode(parameter, depth));
    };

    return {
      // eslint-disable-next-line functional/no-return-void, sonarjs/cognitive-complexity
      CallExpression: (node) => {
        const tsExpressionNode = parserServices.esTreeNodeToTSNodeMap.get(node);
        const callSignature = checker.getResolvedSignature(tsExpressionNode);

        // eslint-disable-next-line functional/no-conditional-statements
        if (
          callSignature === undefined ||
          callSignature.declaration === undefined
        ) {
          return;
        }

        // eslint-disable-next-line functional/no-conditional-statements
        if (callSignature.declaration.kind === SyntaxKind.JSDocSignature) {
          // TODO support JSDoc
          return;
        }

        const typeParameters = callSignature.declaration.typeParameters;
        const parameters = parametersToTypeNodes(
          callSignature.declaration.parameters,
          0,
        );

        const returnType = callSignature.declaration.type;

        // eslint-disable-next-line functional/no-conditional-statements
        if (
          returnType === undefined ||
          typeParameters === undefined ||
          typeParameters.length === 0
        ) {
          return;
        }

        const returnTypes = explodeTypeNode(returnType, 0);

        // Of all the type parameters, these are the ones that are used in the
        // return type (alongside their positional index, which we use next to
        // look up corresponding type arguments)
        const typeParamsUsedInReturnType = typeParameters
          .map((typeParameter, index) => ({ typeParameter, index }))
          .filter((typeParameter) =>
            returnTypes.some(
              (returnType) =>
                isTypeReferenceNode(returnType) &&
                returnType.typeName.kind === SyntaxKind.Identifier &&
                returnType.typeName.text ===
                  typeParameter.typeParameter.name.text,
            ),
          );

        // Of all the type parameters that appear in the return type,
        // are they all set to `unknown` type arguments in this specific call?
        // If so, this is safe even if the function being called is a hidden type assertion.
        const allCorrespondingTypeArgumentsAreUnknownType =
          typeParamsUsedInReturnType.every(({ typeParameter, index }) => {
            const typeArgument = (tsExpressionNode.typeArguments ?? [])[index];
            const typeArgumentType =
              typeArgument !== undefined
                ? checker.getTypeAtLocation(typeArgument)
                : undefined;

            const typeParamDefaultType =
              typeParameter.default !== undefined
                ? checker.getTypeAtLocation(typeParameter.default)
                : undefined;

            const typeToCheck = typeArgumentType ?? typeParamDefaultType;

            return (
              typeToCheck !== undefined &&
              (isTypeUnknownType(typeToCheck) || isTypeNeverType(typeToCheck))
            );
          });

        // eslint-disable-next-line functional/no-conditional-statements
        if (allCorrespondingTypeArgumentsAreUnknownType) {
          return;
        }

        // Confirms that all the type parameters that appear in the return type ALSO
        // appear in at least one (value) parameter. If they do, this probably isn't
        // a hidden type assertion.
        const allTypeParamsUsedInReturnTypeAlsoAppearInValueParams =
          typeParamsUsedInReturnType
            .map(({ typeParameter }) => typeParameter)
            .every((typeParameter) => {
              return parameters.some((parameter) => {
                return (
                  isTypeReferenceNode(parameter) &&
                  parameter.typeName.kind === SyntaxKind.Identifier &&
                  typeParameter.name.text === parameter.typeName.text
                );
              });
            });

        // eslint-disable-next-line functional/no-conditional-statements
        if (!allTypeParamsUsedInReturnTypeAlsoAppearInValueParams) {
          // eslint-disable-next-line functional/no-expression-statements
          context.report({
            node: node,
            messageId: "errorStringGeneric",
          } as const);
        }
      },
    };
  },
  defaultOptions: [],
} as const);

export default noHiddenTypeAssertions;
