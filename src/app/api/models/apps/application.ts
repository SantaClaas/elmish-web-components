import VerifiedApplication from "./verifiedApplication";

/**
 * Represents an application that interfaces with the REST API to access accounts or post statuses.
 */
type Application = VerifiedApplication & {
  /**
   * Client ID key, to be used for obtaining OAuth tokens
   */
  client_id: string;
  /**
   * Client secret key, to be used for obtaining OAuth tokens
   */
  client_secret: string;
};

export default Application;
