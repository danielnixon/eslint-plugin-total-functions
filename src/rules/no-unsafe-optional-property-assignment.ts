import { RuleModule } from "@typescript-eslint/experimental-utils/dist/ts-eslint";
import { isSymbolFlagSet } from "tsutils";
import { Symbol, SymbolFlags } from "typescript";
import {
  createNoUnsafeAssignmentRule,
  MessageId,
  UnsafeIndexAssignmentFunc,
  UnsafePropertyAssignmentFunc,
} from "./unsafe-assignment-rule";

// eslint-disable-next-line functional/functional-parameters
const unsafeIndexAssignmentFunc: UnsafeIndexAssignmentFunc = (): boolean =>
  false;

const unsafePropertyAssignmentFunc: UnsafePropertyAssignmentFunc = (
  // eslint-disable-next-line @typescript-eslint/ban-types
  destinationProperty: Symbol,
  // eslint-disable-next-line @typescript-eslint/ban-types
  sourceProperty: Symbol | undefined
): boolean => {
  const destinationPropIsOptional = isSymbolFlagSet(
    destinationProperty,
    SymbolFlags.Optional
  );

  return destinationPropIsOptional && sourceProperty === undefined;
};

const message =
  "Assigning to an optional property when there is no such property in the source type (optional or otherwise) is unsafe.";

/**
 * An ESLint rule to ban unsafe assignment to optional properties.
 */
const noUnsafeOptionalPropertyAssignment: RuleModule<MessageId, readonly []> = {
  meta: {
    type: "problem",
    docs: {
      category: "Possible Errors",
      description: "Bans unsafe assignment to optional properties.",
      recommended: "error",
      url: "https://github.com/danielnixon/eslint-plugin-total-functions",
    },
    messages: {
      errorStringCallExpression: message,
      errorStringAssignmentExpression: message,
      errorStringVariableDeclaration: message,
      errorStringArrowFunctionExpression: message,
      errorStringTSAsExpression: message,
      errorStringTSTypeAssertion: message,
    },
    schema: [],
  },
  create: createNoUnsafeAssignmentRule(
    unsafePropertyAssignmentFunc,
    unsafeIndexAssignmentFunc
  ),
};

export default noUnsafeOptionalPropertyAssignment;
