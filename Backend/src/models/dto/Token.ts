/**
 *
 * @export
 * @interface Token
 */
export interface Token {
  /**
   * Auth token
   * @type {string}
   * @memberof Token
   */
  token: string;
}

/**
 * Check if a given object implements the Token interface.
 */
export function instanceOfToken(value: object): value is Token {
  if (!("token" in value) || value["token"] === undefined) return false;
  return true;
}

export function TokenFromJSON(json: any): Token {
  return TokenFromJSONTyped(json, false);
}

export function TokenFromJSONTyped(
  json: any,
  ignoreDiscriminator: boolean
): Token {
  if (json == null) {
    return json;
  }
  return {
    token: json["token"]
  };
}

export function TokenToJSON(json: any): Token {
  return TokenToJSONTyped(json, false);
}

export function TokenToJSONTyped(
  value?: Token | null,
  ignoreDiscriminator: boolean = false
): any {
  if (value == null) {
    return value;
  }

  return {
    token: value["token"]
  };
}
