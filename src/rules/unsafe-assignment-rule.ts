/* eslint-disable functional/prefer-immutable-types */
import { ESLintUtils, AST_NODE_TYPES } from "@typescript-eslint/utils";
import { TSESLint } from "@typescript-eslint/utils";
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
  isCallExpression,
  isExpression,
  isIdentifier,
  isObjectType,
  isUnionOrIntersectionType,
} from "tsutils";
import { assignableTypePairs, TypePair } from "./common";
import {
  getDefaultOverrides,
  getTypeImmutability,
  isImmutable,
  isReadonlyDeep,
} from "is-immutable-type";

// eslint-disable-next-line functional/type-declaration-immutability
export type SignaturePairArray = readonly {
  readonly destinationSignature: Signature;
  readonly sourceSignature: Signature;
}[];

export type MessageId =
  | "errorStringCallExpression"
  | "errorStringAssignmentExpression"
  | "errorStringVariableDeclaration"
  | "errorStringArrowFunctionExpression"
  | "errorStringTSAsExpression"
  | "errorStringTSTypeAssertion";

export type UnsafeIndexAssignmentFunc = (
  indexKind: IndexKind,
  destinationType: Type,
  sourceType: Type,
  checker: TypeChecker
) => boolean;

/**
 * Individual rules that are implemented in terms of this reusable `createNoUnsafeAssignmentRule`
 * will have their own specific needs to determine if an assignment is safe or not.
 *
 * @returns "safe" if the assignment is safe, "unsafe" if it is unsafe and undefined if the custom logic
 * has no opinion in this case and the default logic should be used. If "safe" or "unsafe" are returned,
 * the default logic won't be applied at all.
 */
export type CustomUnsafeAssignmentFunc = (
  destinationNode: Node,
  sourceNode: Node,
  rawDestinationType: Type,
  rawSourceType: Type,
  checker: TypeChecker
) => "safe" | "unsafe" | undefined;

/**
 * Custom assignment safety logic that applies to the mutable-readonly and readonly-mutable
 * rules but not to the no-unsafe-optional-property-assignment rule.
 */
export const safeReadonlyMutableAssignment: CustomUnsafeAssignmentFunc = (
  _destinationNode: Node,
  _sourceNode: Node,
  rawDestinationType: Type,
  rawSourceType: Type,
  checker: TypeChecker
) => {
  // eslint-disable-next-line functional/no-conditional-statements
  if (
    getCallSignaturesOfType(rawDestinationType).length > 0 ||
    getCallSignaturesOfType(rawSourceType).length > 0
  ) {
    // is-immutable-type doesn't flag when function parameters are readonly versus mutable
    // so if either type is callable, we defer to our default logic.
    return undefined;
  }

  // eslint-disable-next-line functional/no-try-statements
  try {
    // TODO expose eslint global settings for immutability overrides
    // https://github.com/eslint-functional/eslint-plugin-functional/blob/main/docs/rules/settings/immutability.md
    const immutabilityOverrides = getDefaultOverrides();

    const destinationImmutability = getTypeImmutability(
      checker,
      // eslint-disable-next-line total-functions/no-unsafe-mutable-readonly-assignment
      rawDestinationType,
      immutabilityOverrides
    );

    const sourceImmutability = getTypeImmutability(
      checker,
      // eslint-disable-next-line total-functions/no-unsafe-mutable-readonly-assignment
      rawSourceType,
      immutabilityOverrides
    );

    // eslint-disable-next-line functional/no-conditional-statements
    if (
      isImmutable(destinationImmutability) &&
      isImmutable(sourceImmutability)
    ) {
      // If both sides are immutable, assignment is completely safe.
      return "safe";
    }

    // eslint-disable-next-line functional/no-conditional-statements
    if (
      isReadonlyDeep(destinationImmutability) &&
      isReadonlyDeep(sourceImmutability)
    ) {
      // If both sides are readonly deep, assignment "safe enough" that we don't bother flagging it.
      return "safe";
    }
  } catch {
    return undefined;
  }

  // Otherwise, let's delve deeply into the types and see if it's safe.
  return undefined;
};

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
      // eslint-disable-next-line functional/no-conditional-statements
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
): SignaturePairArray => {
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

export const createNoUnsafeAssignmentRule =
  (
    unsafePropertyAssignmentFunc: UnsafePropertyAssignmentFunc,
    unsafeIndexAssignmentFunc: UnsafeIndexAssignmentFunc,
    customUnsafeAssignmentFunc: CustomUnsafeAssignmentFunc
  ) =>
  (
    context: Readonly<TSESLint.RuleContext<MessageId, readonly unknown[]>>
    // eslint-disable-next-line sonarjs/cognitive-complexity
  ): TSESLint.RuleListener => {
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();

    const isUnsafeIndexAssignment = (
      indexKind: IndexKind,
      destinationNode: Node,
      sourceNode: Node,
      destinationType: Type,
      sourceType: Type,
      checker: TypeChecker,
      seenTypes: readonly TypePair[]
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
            customUnsafeAssignmentFunc,
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
      seenTypes: readonly TypePair[]
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
        customUnsafeAssignmentFunc,
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
      seenTypes: readonly TypePair[]
    ): boolean => {
      // eslint-disable-next-line functional/no-conditional-statements
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

        // eslint-disable-next-line functional/no-conditional-statements
        if (isUnsafe) {
          return true;
        }

        // eslint-disable-next-line functional/no-conditional-statements
        if (sourceProperty === undefined) {
          return false;
        }

        const nextSeenTypes: readonly TypePair[] = seenTypes.concat({
          destinationType,
          sourceType,
        } as const);

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
      customUnsafeAssignmentFunc: CustomUnsafeAssignmentFunc,
      destinationNode: Node,
      sourceNode: Node,
      rawDestinationType: Type,
      rawSourceType: Type,
      checker: TypeChecker,
      seenTypes: readonly TypePair[] = []
    ): boolean => {
      // eslint-disable-next-line functional/no-conditional-statements
      if (rawDestinationType === rawSourceType) {
        // Never unsafe if the types are equal.
        return false;
      }

      const customSafetyResult = customUnsafeAssignmentFunc(
        destinationNode,
        sourceNode,
        rawDestinationType,
        rawSourceType,
        checker
      );

      // eslint-disable-next-line functional/no-conditional-statements
      if (customSafetyResult === "safe") {
        return false;
      }

      // eslint-disable-next-line functional/no-conditional-statements
      if (customSafetyResult === "unsafe") {
        return true;
      }

      const allowedMemberExpressionForUnsafeAssignment: readonly string[] = [
        "filter",
        "map",
        "concat",
        "flatMap",
        "flat",
        "slice",
      ] as const;

      const arraySource = checker.isArrayType(rawSourceType);

      const arrayDestination = checker.isArrayType(rawDestinationType);

      // eslint-disable-next-line functional/no-conditional-statements
      if (isCallExpression(sourceNode) && arraySource && arrayDestination) {
        // Allowed Member Expression Nodes that are safe to assign to a readonly type destination.
        const allowedMemberExpressionNodes: readonly Node[] = sourceNode
          .getChildren()
          .filter((sourceChildNode) => {
            // eslint-disable-next-line functional/no-conditional-statements
            if (isExpression(sourceChildNode)) {
              const lastNode = sourceChildNode.getLastToken();

              const firstNode = sourceChildNode.getChildAt(0);

              // Not allow member expression of non-array member to be safe if it is unsafe assignment.
              const arrayFirstNode = checker.isArrayType(
                checker.getTypeAtLocation(firstNode)
              );

              // eslint-disable-next-line functional/no-conditional-statements
              if (
                lastNode !== undefined &&
                isIdentifier(lastNode) &&
                arrayFirstNode
              ) {
                return allowedMemberExpressionForUnsafeAssignment.includes(
                  lastNode.getText()
                );
              }

              return false;
            }

            return false;
          });

        // eslint-disable-next-line functional/no-conditional-statements
        if (allowedMemberExpressionNodes.length > 0) {
          return false;
        }
      }

      const nextSeenTypes: readonly TypePair[] = seenTypes.concat({
        destinationType: rawDestinationType,
        sourceType: rawSourceType,
      } as const);

      const typePairs = assignableTypePairs(
        rawDestinationType,
        rawSourceType,
        checker
      );

      const objectTypePairs: readonly TypePair[] = typePairs.filter((tp) =>
        intersectionTypeParts(tp.destinationType).some(isObjectType)
      );

      const isUnsafeFunctionAssignment = (
        typePairs: readonly TypePair[]
      ): boolean =>
        typePairs.some(({ sourceType, destinationType }) => {
          const nextSeenTypesWithPair: readonly TypePair[] =
            nextSeenTypes.concat({
              destinationType,
              sourceType,
            } as const);

          const sourceCallSignatures = getCallSignaturesOfType(sourceType);
          const destinationCallSignatures =
            getCallSignaturesOfType(destinationType);

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
                    const destinationParameterType =
                      checker.getTypeOfSymbolAtLocation(
                        destinationParameterSymbol,
                        destinationNode
                      );
                    const sourceParameterSymbol =
                      sourceSignature.getParameters()[index];

                    // eslint-disable-next-line functional/no-conditional-statements
                    if (sourceParameterSymbol === undefined) {
                      return false;
                    }

                    const sourceParameterType =
                      checker.getTypeOfSymbolAtLocation(
                        sourceParameterSymbol,
                        sourceNode
                      );

                    // Source and destination swapped here - function parameters are contravariant.
                    return isUnsafeAssignment(
                      customUnsafeAssignmentFunc,
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
              const destinationReturnType =
                destinationSignature.getReturnType();

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
                  customUnsafeAssignmentFunc,
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
        objectTypePairs: readonly TypePair[]
      ): boolean =>
        objectTypePairs.some(({ sourceType, destinationType }) => {
          const nextSeenTypesWithPair: readonly TypePair[] =
            nextSeenTypes.concat({
              destinationType,
              sourceType,
            } as const);

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
        // eslint-disable-next-line functional/no-conditional-statements
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

        // eslint-disable-next-line functional/no-conditional-statements
        if (
          isUnsafeAssignment(
            customUnsafeAssignmentFunc,
            destinationNode,
            sourceNode,
            destinationType,
            sourceType,
            checker
          )
        ) {
          // eslint-disable-next-line functional/no-expression-statements
          context.report({
            node: node,
            messageId: "errorStringTSTypeAssertion",
          } as const);
        }
      },
      // eslint-disable-next-line functional/no-return-void
      TSAsExpression: (node): void => {
        // eslint-disable-next-line functional/no-conditional-statements
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

        // eslint-disable-next-line functional/no-conditional-statements
        if (
          isUnsafeAssignment(
            customUnsafeAssignmentFunc,
            destinationNode,
            sourceNode,
            destinationType,
            sourceType,
            checker
          )
        ) {
          // eslint-disable-next-line functional/no-expression-statements
          context.report({
            node: node,
            messageId: "errorStringTSAsExpression",
          } as const);
        }
      },
      // eslint-disable-next-line functional/no-return-void
      VariableDeclaration: (node): void => {
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

          // eslint-disable-next-line functional/no-conditional-statements
          if (
            isUnsafeAssignment(
              customUnsafeAssignmentFunc,
              leftTsNode,
              rightTsNode,
              leftType,
              rightType,
              checker
            )
          ) {
            // eslint-disable-next-line functional/no-expression-statements
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
        const rightTsNode = parserServices.esTreeNodeToTSNodeMap.get(
          node.right
        );

        const leftType = checker.getTypeAtLocation(leftTsNode);
        const rightType = checker.getTypeAtLocation(rightTsNode);

        // eslint-disable-next-line functional/no-conditional-statements
        if (
          isUnsafeAssignment(
            customUnsafeAssignmentFunc,
            leftTsNode,
            rightTsNode,
            leftType,
            rightType,
            checker
          )
        ) {
          // eslint-disable-next-line functional/no-expression-statements
          context.report({
            node: node,
            messageId: "errorStringAssignmentExpression",
          } as const);
        }
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
        if (
          destinationType !== undefined &&
          isUnsafeAssignment(
            customUnsafeAssignmentFunc,
            tsNode.expression,
            tsNode.expression,
            destinationType,
            sourceType,
            checker
          )
        ) {
          // eslint-disable-next-line functional/no-expression-statements
          context.report({
            node: node,
            messageId: "errorStringArrowFunctionExpression",
          } as const);
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
        if (
          destinationType !== undefined &&
          isUnsafeAssignment(
            customUnsafeAssignmentFunc,
            tsNode.expression,
            tsNode.expression,
            destinationType,
            sourceType,
            checker
          )
        ) {
          // eslint-disable-next-line functional/no-expression-statements
          context.report({
            node: node,
            messageId: "errorStringArrowFunctionExpression",
          } as const);
        }
      },
      // eslint-disable-next-line functional/no-return-void
      ArrowFunctionExpression: (node): void => {
        // eslint-disable-next-line functional/no-conditional-statements
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

        // eslint-disable-next-line functional/no-conditional-statements
        if (
          isUnsafeAssignment(
            customUnsafeAssignmentFunc,
            destinationNode,
            sourceNode,
            destinationType,
            sourceType,
            checker
          )
        ) {
          // eslint-disable-next-line functional/no-expression-statements
          context.report({
            node: node.body,
            messageId: "errorStringArrowFunctionExpression",
          } as const);
        }
      },
      // eslint-disable-next-line functional/no-return-void
      CallExpression: (node): void => {
        const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);

        // eslint-disable-next-line functional/no-expression-statements, functional/no-return-void
        tsNode.arguments.forEach((argument, i) => {
          const argumentType = checker.getTypeAtLocation(argument);
          const paramType = checker.getContextualType(argument);

          // eslint-disable-next-line functional/no-conditional-statements
          if (
            paramType !== undefined &&
            isUnsafeAssignment(
              customUnsafeAssignmentFunc,
              argument,
              argument,
              paramType,
              argumentType,
              checker
            )
          ) {
            // eslint-disable-next-line functional/no-expression-statements
            context.report({
              node: node.arguments[i] ?? node,
              messageId: "errorStringCallExpression",
            } as const);
          }
        });
      },
    };
  };
