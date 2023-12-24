import { XMLParser } from 'fast-xml-parser';

export const parser = new XMLParser({
  parseTagValue: false,
});
