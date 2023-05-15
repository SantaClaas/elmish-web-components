import { AccessToken } from "../../string";

type Scope = string;
type UnixTimestampInSeconds = number;
type AccessTokenResponse = {
  access_token: AccessToken;
  token_type: "Bearer";
  scope: Scope;
  create_at: UnixTimestampInSeconds;
};

export default AccessTokenResponse;
