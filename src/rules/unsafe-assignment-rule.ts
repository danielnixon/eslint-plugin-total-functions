/* eslint-disable functional/prefer-immutable-types */
import {
  ESLintUtils,
  AST_NODE_TYPES,
  TSESTree,
  ParserServices,
} from "@typescript-eslint/utils";
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
  isObjectType,
  isUnionOrIntersectionType,
} from "tsutils";
import { assignableTypePairs, TypePair } from "./common";

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
    unsafeIndexAssignmentFunc: UnsafeIndexAssignmentFunc
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
        (checker.isArrayType(destinationType) ||
          checker.isArrayType(sourceType)) &&
        !isUnionOrIntersectionType(destinationType) &&
        !isUnionOrIntersectionType(sourceType)
      ) {
        // For performance reasons we avoid checking every array property for unsafe assignment.
        //
        // If one of these arrays is readonly and the other mutable, it will be caught by `isUnsafeIndexAssignment`,
        // so we needn't compare each individual property.
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

      // Infinite recursion suspected...
      if (seenTypes.length > 200) {
        return false;
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

    // Special handling for array methods that return mutable arrays but that
    // we know are shallow copies and therefore safe to have their result
    // assigned to a readonly array.
    const isSafeAssignmentFromArrayMethod = (
      sourceExpression: TSESTree.Expression,
      destinationNode: Node,
      sourceNode: Node,
      destinationType: Type,
      sourceType: Type,
      checker: TypeChecker,
      parserServices: ParserServices
    ): boolean => {
      const safeArrayMethods: readonly string[] = [
        "filter",
        "map",
        "concat",
        "flatMap",
        "flat",
        "slice",
      ] as const;

      // Arrays have number index types. This gives us access to the type within the array.
      const destinationIndexType = destinationType.getNumberIndexType();
      const sourceIndexType = sourceType.getNumberIndexType();

      // eslint-disable-next-line functional/no-conditional-statements, sonarjs/prefer-single-boolean-return
      if (
        // We are assigning to and from arrays
        checker.isArrayType(destinationType) &&
        checker.isArrayType(sourceType) &&
        destinationIndexType !== undefined &&
        sourceIndexType !== undefined &&
        // and the assignment is from calling a member (obj.method(...))
        sourceExpression.type === AST_NODE_TYPES.CallExpression &&
        sourceExpression.callee.type === AST_NODE_TYPES.MemberExpression &&
        // and the thing being called is an array
        // (so we can avoid permitting calls to array methods on other types)
        checker.isArrayType(
          checker.getTypeAtLocation(
            parserServices.esTreeNodeToTSNodeMap.get(
              sourceExpression.callee.object
            )
          )
        ) &&
        // and the method being called is an identifier that we can match on like "concat"
        sourceExpression.callee.property.type === AST_NODE_TYPES.Identifier &&
        // and it's not computed (obj["method"])
        // TODO: support computed properties like myArray["concat"]?
        !sourceExpression.callee.computed &&
        // and the method being called is one that we know is safe to assign to a readonly array
        safeArrayMethods.includes(sourceExpression.callee.property.name) &&
        // and the types within the source and destination array are themselves safe to assign
        // (avoid this issue: https://github.com/danielnixon/eslint-plugin-total-functions/issues/730)
        !isUnsafeAssignment(
          destinationNode,
          sourceNode,
          destinationIndexType,
          sourceIndexType,
          checker
        )
      ) {
        return true;
      }

      return false;
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
            isSafeAssignmentFromArrayMethod(
              declaration.init,
              leftTsNode,
              rightTsNode,
              leftType,
              rightType,
              checker,
              parserServices
            )
          ) {
            return;
          }

          // eslint-disable-next-line functional/no-conditional-statements
          if (
            isUnsafeAssignment(
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
          isSafeAssignmentFromArrayMethod(
            node.right,
            leftTsNode,
            rightTsNode,
            leftType,
            rightType,
            checker,
            parserServices
          )
        ) {
          return;
        }

        // eslint-disable-next-line functional/no-conditional-statements
        if (
          isUnsafeAssignment(
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
        // eslint-disable-next-line functional/no-conditional-statements
        if (node.argument === null) {
          return;
        }

        const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);

        // eslint-disable-next-line functional/no-conditional-statements
        if (tsNode.expression === undefined) {
          return;
        }

        const destinationType = checker.getContextualType(tsNode.expression);

        // eslint-disable-next-line functional/no-conditional-statements
        if (destinationType === undefined) {
          return;
        }

        const sourceType = checker.getTypeAtLocation(tsNode.expression);

        // eslint-disable-next-line functional/no-conditional-statements
        if (
          isSafeAssignmentFromArrayMethod(
            node.argument,
            tsNode.expression,
            tsNode.expression,
            destinationType,
            sourceType,
            checker,
            parserServices
          )
        ) {
          return;
        }

        // eslint-disable-next-line functional/no-conditional-statements
        if (
          isUnsafeAssignment(
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
      // TODO fix this copypasta between YieldExpression and ReturnStatement
      // eslint-disable-next-line functional/no-return-void
      YieldExpression: (node): void => {
        // eslint-disable-next-line functional/no-conditional-statements
        if (node.argument === undefined) {
          return;
        }

        const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);

        // eslint-disable-next-line functional/no-conditional-statements
        if (tsNode.expression === undefined) {
          return;
        }

        const destinationType = checker.getContextualType(tsNode.expression);

        // eslint-disable-next-line functional/no-conditional-statements
        if (destinationType === undefined) {
          return;
        }

        const sourceType = checker.getTypeAtLocation(tsNode.expression);

        // eslint-disable-next-line functional/no-conditional-statements
        if (
          isSafeAssignmentFromArrayMethod(
            node.argument,
            tsNode.expression,
            tsNode.expression,
            destinationType,
            sourceType,
            checker,
            parserServices
          )
        ) {
          return;
        }

        // eslint-disable-next-line functional/no-conditional-statements
        if (
          isUnsafeAssignment(
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

        // eslint-disable-next-line total-functions/no-unsafe-mutable-readonly-assignment
        const destinationNode: Node = parserServices.esTreeNodeToTSNodeMap.get(
          node.returnType.typeAnnotation
        );
        const destinationType = checker.getTypeAtLocation(destinationNode);
        const sourceNode = parserServices.esTreeNodeToTSNodeMap.get(node.body);
        const sourceType = checker.getTypeAtLocation(sourceNode);

        // eslint-disable-next-line functional/no-conditional-statements
        if (
          node.body.type !== AST_NODE_TYPES.BlockStatement &&
          isSafeAssignmentFromArrayMethod(
            node.body,
            destinationNode,
            sourceNode,
            destinationType,
            sourceType,
            checker,
            parserServices
          )
        ) {
          return;
        }

        // eslint-disable-next-line functional/no-conditional-statements
        if (
          isUnsafeAssignment(
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
