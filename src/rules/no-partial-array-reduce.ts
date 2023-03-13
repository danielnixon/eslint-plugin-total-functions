/* eslint-disable functional/prefer-immutable-types */
import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import { isTupleType, isTupleTypeReference, unionTypeParts } from "tsutils";
import { createRule } from "./common";

/**
 * An ESLint rule to ban partial Array.prototype.reduce().
 */
// eslint-disable-next-line total-functions/no-unsafe-readonly-mutable-assignment
const noPartialArrayReduce = createRule({
  name: "no-partial-array-reduce",
  meta: {
    type: "problem",
    docs: {
      description: "Bans partial Array.prototype.reduce()",
      recommended: "error",
    },
    messages: {
      errorStringGeneric:
        "Array.prototype.reduce() is partial. It will throw if the array is empty. Provide an initial value or prove the array is non-empty to prevent this error.",
    },
    schema: [],
  },
  create: (context) => {
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();

    return {
      // eslint-disable-next-line functional/no-return-void, sonarjs/cognitive-complexity
      CallExpression: (node) => {
        // We only care if this call is a member expression.
        // eslint-disable-next-line functional/no-conditional-statements
        if (node.callee.type !== AST_NODE_TYPES.MemberExpression) {
          return;
        }

        // Non-empty array literal are safe.
        // eslint-disable-next-line functional/no-conditional-statements
        if (
          node.callee.object.type === AST_NODE_TYPES.ArrayExpression &&
          node.callee.object.elements[0] !== undefined &&
          node.callee.object.elements[0]?.type !== AST_NODE_TYPES.SpreadElement
        ) {
          return;
        }

        // We only care if this call has exactly one argument.
        // eslint-disable-next-line functional/no-conditional-statements
        if (node.arguments.length !== 1) {
          return;
        }

        const objectType = checker.getTypeAtLocation(
          parserServices.esTreeNodeToTSNodeMap.get(node.callee.object)
        );

        const typeParts = unionTypeParts(objectType);

        // We only care if this call is on an array or tuple (or a type that is a union that includes one or more arrays or tuples)
        // eslint-disable-next-line functional/no-conditional-statements
        if (
          !typeParts.some(
            (t) =>
              checker.isArrayType(t) ||
              isTupleType(t) ||
              isTupleTypeReference(t)
          )
        ) {
          return;
        }

        const isProvablyNonEmpty = typeParts.every((t) => {
          return (
            (isTupleType(t) && t.minLength >= 1) ||
            (isTupleTypeReference(t) && t.target.minLength >= 1)
          );
        });

        // eslint-disable-next-line functional/no-conditional-statements
        if (isProvablyNonEmpty) {
          return;
        }

        const unsafeMethods: readonly string[] = [
          "reduce",
          "reduceRight",
        ] as const;

        // Detect this form:
        // [].reduce(() => "")
        //
        // Or this form:
        // []["reduce"](() => "")
        //
        // Or this form:
        // const n = "reduce" as const;
        // const foo = [][n](() => "");
        //
        // Or this form:
        // declare const n: "reduce" | "reduceRight";
        // const foo = [""][n](() => "");
        const isReduce =
          (node.callee.property.type === AST_NODE_TYPES.Literal &&
            node.callee.computed &&
            typeof node.callee.property.value === "string" &&
            unsafeMethods.includes(node.callee.property.value)) ||
          (node.callee.property.type === AST_NODE_TYPES.Identifier &&
            !node.callee.computed &&
            unsafeMethods.includes(node.callee.property.name)) ||
          (node.callee.property.type === AST_NODE_TYPES.Identifier &&
            node.callee.computed &&
            unionTypeParts(
              checker.getTypeAtLocation(
                parserServices.esTreeNodeToTSNodeMap.get(node.callee.property)
              )
            ).some(
              (type) =>
                type.isStringLiteral() && unsafeMethods.includes(type.value)
            ));

        // eslint-disable-next-line functional/no-conditional-statements
        if (!isReduce) {
          return;
        }

        // eslint-disable-next-line functional/no-expression-statements
        context.report({
          node: node,
          messageId: "errorStringGeneric",
        } as const);
      },
    };
  },
  defaultOptions: [],
} as const);

export default noPartialArrayReduce;
