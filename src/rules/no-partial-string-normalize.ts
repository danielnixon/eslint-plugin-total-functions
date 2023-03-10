/* eslint-disable functional/prefer-immutable-types */
import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import {
  isTypeAssignableToString,
  isTypeFlagSet,
  unionTypeParts,
} from "tsutils";
import { TypeFlags } from "typescript";
import { createRule } from "./common";

/**
 * An ESLint rule to ban partial String.prototype.normalize().
 */
// eslint-disable-next-line total-functions/no-unsafe-readonly-mutable-assignment
const noPartialStringNormalize = createRule({
  name: "no-partial-string-normalize",
  meta: {
    type: "problem",
    docs: {
      description: "Bans partial String.prototype.normalize()",
      recommended: "error",
    },
    messages: {
      errorStringGeneric:
        "String.prototype.normalize() is partial. Wrap it in a wrapper that catches the error and returns undefined.",
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

        const objectType = checker.getTypeAtLocation(
          parserServices.esTreeNodeToTSNodeMap.get(node.callee.object)
        );

        // We only care if this call is on a string object.
        // eslint-disable-next-line functional/no-conditional-statements
        if (!isTypeAssignableToString(checker, objectType)) {
          return;
        }

        // Detect this form:
        // "".normalize("")
        //
        // Or this form:
        // ""["normalize"]("")
        //
        // Or this form:
        // const n = "normalize" as const;
        // const foo = ""[n]("");
        //
        // Or this form:
        // const n: "normalize" | "includes" = ...;
        // const foo = ""[n]("");
        const isNormalize =
          (node.callee.property.type === AST_NODE_TYPES.Literal &&
            node.callee.computed &&
            node.callee.property.value === "normalize") ||
          (node.callee.property.type === AST_NODE_TYPES.Identifier &&
            !node.callee.computed &&
            node.callee.property.name === "normalize") ||
          (node.callee.property.type === AST_NODE_TYPES.Identifier &&
            node.callee.computed &&
            unionTypeParts(
              checker.getTypeAtLocation(
                parserServices.esTreeNodeToTSNodeMap.get(node.callee.property)
              )
            ).some(
              (type) => type.isStringLiteral() && type.value === "normalize"
            ));

        // We only care if this call is to the normalize method.
        // eslint-disable-next-line functional/no-conditional-statements
        if (!isNormalize) {
          return;
        }

        // eslint-disable-next-line functional/no-conditional-statements
        if (node.arguments.length > 1) {
          // This is a compiler error so don't bother flagging it.
          return;
        }

        const argument = node.arguments[0];

        // eslint-disable-next-line functional/no-conditional-statements
        if (argument === undefined) {
          // We only care if the caller provides an argument.
          // Zero arguments (`"".normalize()`) is always safe.
          return;
        }

        const safeValues = ["NFC", "NFD", "NFKC", "NFKD"];

        // eslint-disable-next-line functional/no-conditional-statements
        if (
          argument.type === AST_NODE_TYPES.Literal &&
          typeof argument.value === "string" &&
          safeValues.includes(argument.value)
        ) {
          // TODO errorStringWillDefinitelyThrow
          // These four values are all safe.
          return;
        }

        // eslint-disable-next-line functional/no-conditional-statements
        if (
          argument.type === AST_NODE_TYPES.Identifier &&
          unionTypeParts(
            checker.getTypeAtLocation(
              parserServices.esTreeNodeToTSNodeMap.get(argument)
            )
          ).every(
            (type) =>
              (type.isStringLiteral() && safeValues.includes(type.value)) ||
              isTypeFlagSet(type, TypeFlags.Undefined)
          )
        ) {
          return;
        }

        // Anything else risks throwing an error so flag it.
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

export default noPartialStringNormalize;
