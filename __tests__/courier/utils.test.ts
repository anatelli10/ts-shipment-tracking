import * as utils from '../../src/couriers/utils';

describe('reverseOneToManyDictionary', () => {
  const input = {
    LABEL_CREATED: ['PU', 'PX', 'OC'],
    OUT_FOR_DELIVERY: ['OD'],
  } as const;

  const output = utils.reverseOneToManyDictionary(input);

  it('reverses a one to many dictionary to a many to one dictionary', () => {
    expect(output).toEqual({
      PU: 'LABEL_CREATED',
      PX: 'LABEL_CREATED',
      OC: 'LABEL_CREATED',
      OD: 'OUT_FOR_DELIVERY',
    });
  });
});
