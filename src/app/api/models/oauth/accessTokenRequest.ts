type AccessTokenRequest = {
  client_id: string;
  client_secret: string;
  redirect_uri: URL;
  grant_type: "authorization_code";
  code: string;
  scope: "read";
};

export default AccessTokenRequest;
