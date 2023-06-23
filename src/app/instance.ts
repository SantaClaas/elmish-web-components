import Application from "./api/models/apps/application";

/**
 * Represents metadata about a mastodon server instance
 */
type Instance = {
  baseUrl: URL;
};

/**
 * Represents an instance where we have our app registered
 */
export type InstanceWithCredentials = {
  //TODO think about adding scopes her
  app: Application;
  instance: Instance;
};

export default Instance;
