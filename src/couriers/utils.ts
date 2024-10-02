import axios from "axios";

/**
 * Reverses a Record<string, string[]> such that every value's array member becomes a key pointing to its respective key in the input.
 * e.g. { animal: ['cat','dog','elephant'] } becomes { cat: 'animal', dog: 'animal', elephant: 'animal' }
 *
 * This allows for maps with many keys with the same value to be defined in reverse for better readability & maintainability.
 *
 * @example
 * // `as const` const asserted object input for narrowest typing
 * const input = {
 *   LABEL_CREATED: ['PU', 'PX', 'OC'],
 *   OUT_FOR_DELIVERY: ['OD'],
 * } as const;
 *
 * const output: {
 *     PU: "LABEL_CREATED";
 *     PX: "LABEL_CREATED";
 *     OC: "LABEL_CREATED";
 *     OD: "OUT_FOR_DELIVERY";
 * } = reverseOneToManyDictionary(input);
 *
 * const value: "LABEL_CREATED" = output['PX'];
 */
export const reverseOneToManyDictionary = <OneToManyDictionary extends Readonly<Record<string, readonly string[]>>>(
  oneToManyDictionary: OneToManyDictionary
): {
  [StringArrayValue in OneToManyDictionary[keyof OneToManyDictionary][number]]: {
    readonly [Key in keyof OneToManyDictionary]-?: StringArrayValue extends OneToManyDictionary[Key][number]
      ? Key
      : never;
  }[keyof OneToManyDictionary];
} =>
  Object.fromEntries(
    Object.entries(oneToManyDictionary).flatMap(([key, values]) => values.map((value: any) => [value, key]))
  );

export const getLocation = ({
  city,
  country,
  state,
  zip,
}: {
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
}) => [city, state, country, zip].filter(Boolean).join(" ") || undefined;

// source: https://github.com/joonhocho/tsdef/blob/4f0a9f07c5ac704604afeb64f52de3fc7709989c/src/index.ts#L222C1-L226C3
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer I> ? Array<DeepPartial<I>> : DeepPartial<T[P]>;
};

export const clientCredentialsTokenRequest = async ({
  url,
  client_id,
  client_secret,
  scope,
  useAuthorizationHeader,
}: {
  url: string;
  client_id: string;
  client_secret: string;
  scope?: string;
  useAuthorizationHeader?: true;
}) => {
  type OAuthTokenResponse = {
    access_token: string;
    token_type: string;
    issued_at: number;
    expires_in: number;
    status: string;
    scope: string;
    issuer: string;
    client_id: string;
    application_name: string;
    api_products: string;
    public_key: string;
  };

  const {
    data: { access_token },
  } = await axios<OAuthTokenResponse>(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },

    // Pass the creds as an Authorization header
    ...(useAuthorizationHeader && {
      auth: {
        username: client_id,
        password: client_secret,
      },
    }),

    data: new URLSearchParams({
      // Pass the creds as part of the payload
      ...(!useAuthorizationHeader && {
        client_id,
        client_secret,
      }),

      grant_type: "client_credentials",
      ...(scope && { scope }),
    }),
  });

  return access_token;
};
