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
