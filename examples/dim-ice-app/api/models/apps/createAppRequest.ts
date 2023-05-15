/**
 * Represents a request to the Mastodon API to create a new app to obtain OAuth2 credentials.
 * https://docs.joinmastodon.org/methods/apps/
 */
type CreateAppRequest = {
  /**
   * A name for your application
   */
  client_name: string;

  /**
   * Where the user should be redirected after authorization. To display the authorization code to the user instead of
   * redirecting to a web page, use urn:ietf:wg:oauth:2.0:oob in this parameter.
   */
  redirect_uris: string;

  /**
   * Space separated list of scopes. If none is provided, defaults to read. See OAuth Scopes for a list of possible
   * scopes.
   */
  scopes?: string | undefined;

  /**
   * A URL to the homepage of your app
   */
  website?: string | undefined;
};
export default CreateAppRequest;
