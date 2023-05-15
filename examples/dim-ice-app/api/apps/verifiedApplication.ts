/**
 * Returned from the verify_credentials endpoint and is the same as application just without credentials
 */
type VerifiedApplication = {
  /**
   * The name of your application.
   */
  name: string;
  /**
   * Description: The website associated with your application.
   */
  website?: string | undefined;
  /**
   * Used for Push Streaming API. Returned with POST /api/v1/apps. Equivalent to WebPushSubscription#server_key
   */
  vapid_key: string;
};

export default VerifiedApplication;
