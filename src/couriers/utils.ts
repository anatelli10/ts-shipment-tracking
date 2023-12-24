type OneToManyDictionary = Readonly<Record<string, readonly string[]>>;

type ReverseOneToManyDictionary<Dictionary extends OneToManyDictionary> = {
  [StringArrayValue in Dictionary[keyof Dictionary][number]]: {
    [Key in keyof Dictionary]-?: StringArrayValue extends Dictionary[Key][number]
      ? Key
      : never;
  }[keyof Dictionary];
};

export const reverseOneToManyDictionary = <
  Dictionary extends OneToManyDictionary
>(
  oneToManyDictionary: Dictionary
): ReverseOneToManyDictionary<Dictionary> =>
  Object.fromEntries(
    Object.entries(oneToManyDictionary).flatMap(([key, values]) =>
      values.map((value: any) => [value, key])
    )
  ) as ReverseOneToManyDictionary<Dictionary>;

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
}) => [city, state, country, zip].filter(Boolean).join(' ') || undefined;

// source: https://github.com/joonhocho/tsdef/blob/4f0a9f07c5ac704604afeb64f52de3fc7709989c/src/index.ts#L222C1-L226C3
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer I>
    ? Array<DeepPartial<I>>
    : DeepPartial<T[P]>;
};
