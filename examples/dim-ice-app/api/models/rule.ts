import { NumberString } from "./string";

/**
 * Represents a rule that server users should follow.
 * https://docs.joinmastodon.org/entities/Rule/
 */
type Rule = {
  /**
   * An identifier for the rule.
   */
  id: NumberString;
  /**
   * The rule to be followed.
   */
  text: string;
};

export default Rule;
