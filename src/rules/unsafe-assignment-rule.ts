import {
  RuleContext,
  RuleListener,
} from "@typescript-eslint/experimental-utils/dist/ts-eslint";
import {
  ESLintUtils,
  AST_NODE_TYPES,
} from "@typescript-eslint/experimental-utils";
import {
  Type,
  Symbol,
  IndexKind,
  Node,
  TypeChecker,
  Signature,
} from "typescript";
import {
  getCallSignaturesOfType,
  intersectionTypeParts,
  isObjectType,
  isUnionOrIntersectionType,
  unionTypeParts,
} from "tsutils";

export type TypePairArray = ReadonlyArray<{
  readonly destinationType: Type;
  readonly sourceType: Type;
}>;

export type SignaturePairArray = ReadonlyArray<{
  readonly destinationSignature: Signature;
  readonly sourceSignature: Signature;
}>;

export type MessageId =
  | "errorStringCallExpression"
  | "errorStringAssignmentExpression"
  | "errorStringVariableDeclaration"
  | "errorStringArrowFunctionExpression"
  | "errorStringTSAsExpression"
  | "errorStringTSTypeAssertion";

export type Context = Readonly<RuleContext<MessageId, readonly []>>;

export type UnsafeIndexAssignmentFunc = (
  indexKind: IndexKind,
  destinationType: Type,
  sourceType: Type,
  checker: TypeChecker
) => boolean;

export type UnsafePropertyAssignmentFunc = (
  // eslint-disable-next-line @typescript-eslint/ban-types
  destinationProperty: Symbol,
  // eslint-disable-next-line @typescript-eslint/ban-types
  sourceProperty: Symbol | undefined,
  destinationType: Type,
  sourceType: Type,
  checker: TypeChecker
) => boolean;

const isSignatureAssignable = (
  destinationNode: Node,
  sourceNode: Node,
  destinationSignature: Signature,
  sourceSignature: Signature,
  checker: TypeChecker
): boolean => {
  const returnTypeIsAssignable = checker.isTypeAssignableTo(
    sourceSignature.getReturnType(),
    destinationSignature.getReturnType()
  );

  const allParametersAreAssignable = destinationSignature.parameters.every(
    (destinationParameter, index) => {
      const sourceParameter = sourceSignature.parameters[index];
      // eslint-disable-next-line functional/no-conditional-statement
      if (sourceParameter === undefined) {
        return false;
      }

      // source and destination parameter reversed here due to contravariance.
      return checker.isTypeAssignableTo(
        checker.getTypeOfSymbolAtLocation(
          destinationParameter,
          destinationNode
        ),
        checker.getTypeOfSymbolAtLocation(sourceParameter, sourceNode)
      );
    }
  );

  return returnTypeIsAssignable && allParametersAreAssignable;
};

const assignableSignaturePairs = (
  destinationNode: Node,
  sourceNode: Node,
  destinationSignatures: readonly Signature[],
  sourceSignatures: readonly Signature[],
  checker: TypeChecker
  // TODO https://github.com/danielnixon/eslint-plugin-total-functions/issues/100
  // eslint-disable-next-line total-functions/no-unsafe-mutable-readonly-assignment
): SignaturePairArray => {
  // TODO https://github.com/danielnixon/eslint-plugin-total-functions/issues/100
  // eslint-disable-next-line total-functions/no-unsafe-mutable-readonly-assignment
  return sourceSignatures.flatMap((sourceSignature) =>
    destinationSignatures
      .filter((destinationSignature) =>
        isSignatureAssignable(
          destinationNode,
          sourceNode,
          sourceSignature,
          destinationSignature,
          checker
        )
      )
      .map((destinationSignature) => ({
        sourceSignature,
        destinationSignature,
      }))
  );
};

/**
 * Breaks the supplied types into their union type parts and returns an
 * array of pairs of constituent types that are assignable.
 */
const assignableTypePairs = (
  rawDestinationType: Type,
  rawSourceType: Type,
  checker: TypeChecker
  // TODO remove this eslint-disable
  // eslint-disable-next-line total-functions/no-unsafe-mutable-readonly-assignment
): TypePairArray => {
  // TODO https://github.com/danielnixon/eslint-plugin-total-functions/issues/100
  // eslint-disable-next-line total-functions/no-unsafe-mutable-readonly-assignment
  const destinationTypeParts: readonly Type[] = unionTypeParts(
    rawDestinationType
  );

  // TODO https://github.com/danielnixon/eslint-plugin-total-functions/issues/100
  // eslint-disable-next-line total-functions/no-unsafe-mutable-readonly-assignment
  const sourceTypeParts: readonly Type[] = unionTypeParts(rawSourceType);

  // TODO https://github.com/danielnixon/eslint-plugin-total-functions/issues/100
  // eslint-disable-next-line total-functions/no-unsafe-mutable-readonly-assignment
  return sourceTypeParts.flatMap((sourceTypePart) =>
    destinationTypeParts
      .filter((destinationTypePart) =>
        checker.isTypeAssignableTo(sourceTypePart, destinationTypePart)
      )
      .map((destinationTypePart) => ({
        sourceType: sourceTypePart,
        destinationType: destinationTypePart,
      }))
  );
};

export const createNoUnsafeAssignmentRule = (
  unsafePropertyAssignmentFunc: UnsafePropertyAssignmentFunc,
  unsafeIndexAssignmentFunc: UnsafeIndexAssignmentFunc
  // eslint-disable-next-line sonarjs/cognitive-complexity
) => (context: Context): RuleListener => {
  const parserServices = ESLintUtils.getParserServices(context);
  const checker = parserServices.program.getTypeChecker();

  const isUnsafeIndexAssignment = (
    indexKind: IndexKind,
    destinationNode: Node,
    sourceNode: Node,
    destinationType: Type,
    sourceType: Type,
    checker: TypeChecker,
    seenTypes: TypePairArray
  ): boolean => {
    const isUnsafe = unsafeIndexAssignmentFunc(
      indexKind,
      destinationType,
      sourceType,
      checker
    );

    const destinationIndexType =
      indexKind === IndexKind.Number
        ? destinationType.getNumberIndexType()
        : destinationType.getStringIndexType();
    const sourceIndexType =
      indexKind === IndexKind.Number
        ? sourceType.getNumberIndexType()
        : sourceType.getStringIndexType();

    // This is unsafe if...
    return (
      // this particular rule considers the index assignment unsafe, or
      isUnsafe ||
      // the index types are considered unsafe themselves (recursively).
      (destinationIndexType !== undefined &&
        sourceIndexType !== undefined &&
        isUnsafeAssignment(
          destinationNode,
          sourceNode,
          destinationIndexType,
          sourceIndexType,
          checker,
          seenTypes
        ))
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
    seenTypes: TypePairArray
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
    seenTypes: TypePairArray
  ): boolean => {
    // eslint-disable-next-line functional/no-conditional-statement
    if (
      checker.isArrayType(destinationType) &&
      !isUnionOrIntersectionType(destinationType) &&
      !isUnionOrIntersectionType(sourceType)
    ) {
      // For performance reasons we avoid checking every array property for unsafe assignment.
      //
      // If one of these arrays is readonly and the other mutable, it will be caught by `isUnsafeIndexAssignment`,
      // so we needn't compare each individual property.
      //
      // Additionally, the length property of tuples is technically mutable (wtf) so we ignore arrays for this reason too.
      // Observe:
      //   const foo = [] as const;
      //   foo.length = 0;
      //
      // TODO what about tuples?
      // TODO should we ignore other built-in types like strings, symbols and numbers for performance too?
      return false;
    }

    return destinationType.getProperties().some((destinationProperty) => {
      const sourceProperty = sourceType.getProperty(destinationProperty.name);

      const isUnsafe = unsafePropertyAssignmentFunc(
        destinationProperty,
        sourceProperty,
        destinationType,
        sourceType,
        checker
      );

      // eslint-disable-next-line functional/no-conditional-statement
      if (isUnsafe) {
        return true;
      }

      // eslint-disable-next-line functional/no-conditional-statement
      if (sourceProperty === undefined) {
        return false;
      }

      // TODO https://github.com/danielnixon/eslint-plugin-total-functions/issues/100
      // eslint-disable-next-line total-functions/no-unsafe-mutable-readonly-assignment
      const nextSeenTypes: TypePairArray = seenTypes.concat({
        destinationType,
        sourceType,
      });

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
    seenTypes: TypePairArray = []
  ): boolean => {
    // eslint-disable-next-line functional/no-conditional-statement
    if (rawDestinationType === rawSourceType) {
      // Never unsafe if the types are equal.
      return false;
    }

    // TODO https://github.com/danielnixon/eslint-plugin-total-functions/issues/100
    // eslint-disable-next-line total-functions/no-unsafe-mutable-readonly-assignment
    const nextSeenTypes: TypePairArray = seenTypes.concat({
      destinationType: rawDestinationType,
      sourceType: rawSourceType,
    });

    const typePairs = assignableTypePairs(
      rawDestinationType,
      rawSourceType,
      checker
    );

    // TODO https://github.com/danielnixon/eslint-plugin-total-functions/issues/100
    // eslint-disable-next-line total-functions/no-unsafe-mutable-readonly-assignment
    const objectTypePairs: TypePairArray = typePairs.filter((tp) =>
      intersectionTypeParts(tp.destinationType).some(isObjectType)
    );

    const isUnsafeFunctionAssignment = (typePairs: TypePairArray): boolean =>
      typePairs.some(({ sourceType, destinationType }) => {
        // TODO https://github.com/danielnixon/eslint-plugin-total-functions/issues/100
        // eslint-disable-next-line total-functions/no-unsafe-mutable-readonly-assignment
        const nextSeenTypesWithPair: TypePairArray = nextSeenTypes.concat({
          destinationType,
          sourceType,
        });

        const sourceCallSignatures = getCallSignaturesOfType(sourceType);
        const destinationCallSignatures = getCallSignaturesOfType(
          destinationType
        );

        const signaturePairs = assignableSignaturePairs(
          destinationNode,
          sourceNode,
          destinationCallSignatures,
          sourceCallSignatures,
          checker
        );

        return signaturePairs.some(
          ({ destinationSignature, sourceSignature }) => {
            // eslint-disable-next-line functional/functional-parameters
            const isUnsafeParameterAssignment = (): boolean => {
              return destinationSignature
                .getParameters()
                .some((destinationParameterSymbol, index) => {
                  const destinationParameterType = checker.getTypeOfSymbolAtLocation(
                    destinationParameterSymbol,
                    destinationNode
                  );
                  const sourceParameterSymbol = sourceSignature.getParameters()[
                    index
                  ];

                  // eslint-disable-next-line functional/no-conditional-statement
                  if (sourceParameterSymbol === undefined) {
                    return false;
                  }

                  const sourceParameterType = checker.getTypeOfSymbolAtLocation(
                    sourceParameterSymbol,
                    sourceNode
                  );

                  // Source and destination swapped here - function parameters are contravariant.
                  return isUnsafeAssignment(
                    sourceNode,
                    destinationNode,
                    sourceParameterType,
                    destinationParameterType,
                    checker,
                    nextSeenTypesWithPair
                  );
                });
            };

            const sourceReturnType = sourceSignature.getReturnType();
            const destinationReturnType = destinationSignature.getReturnType();

            // This is an unsafe assignment if...
            return (
              // we're not in an infinitely recursive type,
              seenTypes.every(
                (t) =>
                  t.destinationType !== destinationType &&
                  t.sourceType !== sourceType
              ) &&
              // and the types we're assigning from and to are different,
              destinationType !== sourceType &&
              // and the return types of the functions are unsafe assignment,
              (isUnsafeAssignment(
                destinationNode,
                sourceNode,
                destinationReturnType,
                sourceReturnType,
                checker,
                nextSeenTypesWithPair
              ) ||
                // or the parameter types of the functions are unsafe assignment.
                isUnsafeParameterAssignment())
            );
          }
        );
      });

    const inUnsafeObjectAssignment = (
      objectTypePairs: TypePairArray
    ): boolean =>
      objectTypePairs.some(({ sourceType, destinationType }) => {
        // TODO https://github.com/danielnixon/eslint-plugin-total-functions/issues/100
        // eslint-disable-next-line total-functions/no-unsafe-mutable-readonly-assignment
        const nextSeenTypesWithPair: TypePairArray = nextSeenTypes.concat({
          destinationType,
          sourceType,
        });

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
          // unsafe string index assignment, or
          (isUnsafeIndexAssignment(
            IndexKind.String,
            destinationNode,
            sourceNode,
            destinationType,
            sourceType,
            checker,
            nextSeenTypesWithPair
          ) ||
            // unsafe number index assignment, or
            isUnsafeIndexAssignment(
              IndexKind.Number,
              destinationNode,
              sourceNode,
              destinationType,
              sourceType,
              checker,
              nextSeenTypesWithPair
            ) ||
            // unsafe property assignment.
            isUnsafePropertyAssignment(
              destinationNode,
              sourceNode,
              destinationType,
              sourceType,
              checker,
              nextSeenTypesWithPair
            ))
        );
      });

    return (
      inUnsafeObjectAssignment(objectTypePairs) ||
      isUnsafeFunctionAssignment(typePairs)
    );
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
          messageId: "errorStringTSTypeAssertion",
        } as const);
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
          messageId: "errorStringTSAsExpression",
        } as const);
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
          // If there is no type annotation then there's no risk of unsafe assignment.
          return;
        }

        // eslint-disable-next-line functional/no-conditional-statement
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
            messageId: "errorStringVariableDeclaration",
          } as const);
        }
      });
    },
    // eslint-disable-next-line functional/no-return-void
    AssignmentExpression: (node): void => {
      const leftTsNode = parserServices.esTreeNodeToTSNodeMap.get(node.left);
      const rightTsNode = parserServices.esTreeNodeToTSNodeMap.get(node.right);

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
          messageId: "errorStringAssignmentExpression",
        } as const);
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
          messageId: "errorStringArrowFunctionExpression",
        } as const);
      }
    },
    // TODO: YieldExpression?
    // eslint-disable-next-line functional/no-return-void
    ArrowFunctionExpression: (node): void => {
      // eslint-disable-next-line functional/no-conditional-statement
      if (node.returnType === undefined) {
        return;
      }
      // TODO fix this
      // eslint-disable-next-line total-functions/no-unsafe-mutable-readonly-assignment
      const destinationNode: Node = parserServices.esTreeNodeToTSNodeMap.get(
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
          messageId: "errorStringArrowFunctionExpression",
        } as const);
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
            node: node.arguments[i] ?? node,
            messageId: "errorStringCallExpression",
          } as const);
        }
      });
    },
  };
};
