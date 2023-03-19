/* eslint-disable functional/prefer-immutable-types */
import {
  ESLintUtils,
  AST_NODE_TYPES,
  TSESTree,
  ParserServices,
} from "@typescript-eslint/utils";
import { TSESLint } from "@typescript-eslint/utils";
import { Type, Node, TypeChecker } from "typescript";

export type MessageId =
  | "errorStringCallExpression"
  | "errorStringAssignmentExpression"
  | "errorStringVariableDeclaration"
  | "errorStringArrowFunctionExpression";

export const createNoUnsafeAssignmentRule =
  (
    isUnsafeAssignment: (
      checker: TypeChecker,
      destinationType: Type,
      sourceType: Type
    ) => boolean
  ) =>
  (
    context: Readonly<TSESLint.RuleContext<MessageId, readonly unknown[]>>
    // eslint-disable-next-line sonarjs/cognitive-complexity, total-functions/no-unsafe-readonly-mutable-assignment
  ): TSESLint.RuleListener => {
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();

    // Special handling for array methods that return mutable arrays but that
    // we know are shallow copies and therefore safe to have their result
    // assigned to a readonly array.
    const isSafeAssignmentFromArrayMethod = (
      sourceExpression: TSESTree.Expression,
      destinationType: Type,
      sourceType: Type,
      checker: TypeChecker,
      parserServices: ParserServices
    ): "safe" | "unsafe" | "unknown" => {
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

      return checker.isArrayType(destinationType) &&
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
        safeArrayMethods.includes(sourceExpression.callee.property.name)
        ? // and the types within the source and destination array are themselves safe to assign
          // (avoid this issue: https://github.com/danielnixon/eslint-plugin-total-functions/issues/730)
          isUnsafeAssignment(checker, destinationIndexType, sourceIndexType)
          ? "unsafe"
          : "safe"
        : "unknown";
    };

    return {
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

          const arrayMethodCallSafety = isSafeAssignmentFromArrayMethod(
            declaration.init,
            leftType,
            rightType,
            checker,
            parserServices
          );

          // eslint-disable-next-line functional/no-conditional-statements
          if (arrayMethodCallSafety === "safe") {
            return;
          }

          // eslint-disable-next-line functional/no-conditional-statements
          if (
            arrayMethodCallSafety === "unsafe" ||
            isUnsafeAssignment(checker, leftType, rightType)
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

        const arrayMethodCallSafety = isSafeAssignmentFromArrayMethod(
          node.right,
          leftType,
          rightType,
          checker,
          parserServices
        );

        // eslint-disable-next-line functional/no-conditional-statements
        if (arrayMethodCallSafety === "safe") {
          return;
        }

        // eslint-disable-next-line functional/no-conditional-statements
        if (
          arrayMethodCallSafety === "unsafe" ||
          isUnsafeAssignment(checker, leftType, rightType)
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

        const arrayMethodCallSafety = isSafeAssignmentFromArrayMethod(
          node.argument,
          destinationType,
          sourceType,
          checker,
          parserServices
        );

        // eslint-disable-next-line functional/no-conditional-statements
        if (arrayMethodCallSafety === "safe") {
          return;
        }

        // eslint-disable-next-line functional/no-conditional-statements
        if (
          arrayMethodCallSafety === "unsafe" ||
          isUnsafeAssignment(checker, destinationType, sourceType)
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

        const arrayMethodCallSafety = isSafeAssignmentFromArrayMethod(
          node.argument,
          destinationType,
          sourceType,
          checker,
          parserServices
        );

        // eslint-disable-next-line functional/no-conditional-statements
        if (arrayMethodCallSafety === "safe") {
          return;
        }

        // eslint-disable-next-line functional/no-conditional-statements
        if (
          arrayMethodCallSafety === "unsafe" ||
          isUnsafeAssignment(checker, destinationType, sourceType)
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

        const arrayMethodCallSafety =
          node.body.type !== AST_NODE_TYPES.BlockStatement
            ? isSafeAssignmentFromArrayMethod(
                node.body,
                destinationType,
                sourceType,
                checker,
                parserServices
              )
            : "unknown";

        // eslint-disable-next-line functional/no-conditional-statements
        if (arrayMethodCallSafety === "safe") {
          return;
        }

        // eslint-disable-next-line functional/no-conditional-statements
        if (isUnsafeAssignment(checker, destinationType, sourceType)) {
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
            isUnsafeAssignment(checker, paramType, argumentType)
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
