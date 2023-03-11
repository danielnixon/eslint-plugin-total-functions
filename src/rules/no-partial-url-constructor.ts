/* eslint-disable functional/prefer-immutable-types */
import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import { createRule, typeSymbolName } from "./common";

/**
 * An ESLint rule to ban the partial URL construction.
 */
// eslint-disable-next-line total-functions/no-unsafe-readonly-mutable-assignment
const noPartialUrlConstructor = createRule({
  name: "no-partial-url-constructor",
  meta: {
    type: "problem",
    docs: {
      description: "Bans the partial URL construction.",
      recommended: "error",
    },
    messages: {
      errorStringWillDefinitelyThrow:
        "This invalid URL constructor will throw a TypeError at runtime.",
      errorStringGeneric:
        "Don't use the URL constructor directly because it can throw and because URLs are mutable. Instead, use `readonlyURL` from the readonly-types package.",
    },
    schema: [],
  },
  create: (context) => {
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();

    const isValidUrl = (s: string, base?: string): boolean => {
      // eslint-disable-next-line functional/no-try-statements
      try {
        // eslint-disable-next-line functional/no-expression-statements, total-functions/no-partial-url-constructor
        new URL(s, base);
        return true;
      } catch {
        return false;
      }
    };

    return {
      // eslint-disable-next-line functional/no-return-void, sonarjs/cognitive-complexity
      NewExpression: (node) => {
        // eslint-disable-next-line functional/no-conditional-statements
        if (node.arguments.length === 0 || node.arguments.length > 2) {
          // TypeScript will catch this case.
          return;
        }

        const objectNode = parserServices.esTreeNodeToTSNodeMap.get(
          node.callee
        );
        const objectType = checker.getTypeAtLocation(objectNode);

        const prototype = checker.getPropertyOfType(objectType, "prototype");

        const prototypeType =
          prototype !== undefined
            ? checker.getTypeOfSymbolAtLocation(prototype, objectNode)
            : undefined;

        // eslint-disable-next-line functional/no-conditional-statements
        if (
          prototypeType !== undefined &&
          typeSymbolName(prototypeType) === "URL"
        ) {
          // eslint-disable-next-line functional/no-conditional-statements
          if (
            node.arguments.length === 1 &&
            node.arguments[0] !== undefined &&
            node.arguments[0].type === AST_NODE_TYPES.Literal &&
            typeof node.arguments[0].value === "string"
          ) {
            // eslint-disable-next-line functional/no-conditional-statements
            if (!isValidUrl(node.arguments[0].value)) {
              // eslint-disable-next-line functional/no-expression-statements
              context.report({
                node: node.arguments[0],
                messageId: "errorStringWillDefinitelyThrow",
              } as const);
            }
            return;
          }

          // eslint-disable-next-line functional/no-conditional-statements
          if (
            node.arguments.length === 2 &&
            node.arguments[0] !== undefined &&
            node.arguments[0].type === AST_NODE_TYPES.Literal &&
            typeof node.arguments[0].value === "string" &&
            node.arguments[1] !== undefined &&
            node.arguments[1].type === AST_NODE_TYPES.Literal &&
            typeof node.arguments[1].value === "string"
          ) {
            // eslint-disable-next-line functional/no-conditional-statements
            if (!isValidUrl(node.arguments[0].value, node.arguments[1].value)) {
              // eslint-disable-next-line functional/no-expression-statements
              context.report({
                node: node,
                messageId: "errorStringWillDefinitelyThrow",
              } as const);
            }
            return;
          }

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

export default noPartialUrlConstructor;
