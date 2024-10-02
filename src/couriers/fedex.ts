import {
  clientCredentialsTokenRequest,
  DeepPartial,
  getLocation,
  reverseOneToManyDictionary,
} from "./utils";
import { Courier, ParseOptions, TrackingEvent, TrackingStatus } from "../types";
import { fedex } from "ts-tracking-number";
import axios from "axios";

type TrackDetails = DeepPartial<{
  eventType: keyof typeof statusCodes;
  eventDescription: string;
  scanLocation: {
    city: string;
    stateOrProvinceCode: string;
    countryCode: string;
    postalCode: string;
  };
  date: string;
}>;

// prettier-ignore
const statusCodes = reverseOneToManyDictionary({
  [TrackingStatus.LABEL_CREATED]: [
    'PU', 'PX', 'OC',
  ],
  [TrackingStatus.IN_TRANSIT]: [
    'AA', 'AC', 'AD', 'AF', 'AP', 'AR', 'AX', 'CH', 'DD', 'DP',
    'DR', 'DS', 'DY', 'EA', 'ED', 'EO', 'EP', 'FD', 'HL', 'IT',
    'IX', 'LO', 'PF', 'PL', 'PM', 'RR', 'RM', 'RC', 'SF', 'SP',
    'TR', 'CC', 'CD', 'CP', 'OF', 'OX', 'PD', 'SH', 'CU', 'BR',
    'TP',
  ],
  [TrackingStatus.OUT_FOR_DELIVERY]: [
    'OD',
  ],
  [TrackingStatus.RETURNED_TO_SENDER]: [
    'RS', 'RP', 'LP', 'RG', 'RD',
  ],
  [TrackingStatus.EXCEPTION]: [
    'CA', 'DE', 'SE',
  ],
  [TrackingStatus.DELIVERED]: [
    'DL', 'HP',
  ],
} as const);

const getTrackingEvent = ({
  scanLocation,
  eventDescription,
  eventType,
  date,
}: TrackDetails): TrackingEvent => ({
  status: (eventType && statusCodes[eventType]) || undefined,
  label: eventDescription,
  location: getLocation({
    city: scanLocation?.city,
    state: scanLocation?.stateOrProvinceCode,
    country: scanLocation?.countryCode,
    zip: scanLocation?.postalCode,
  }),
  time: date ? Date.parse(date) : undefined,
});

const parseOptions: ParseOptions = {
  getShipment: (response) =>
    response.output.completeTrackResults[0].trackResults[0],

  checkForError: (response) => response.errors,

  getTrackingEvents: (shipment) => shipment.scanEvents.map(getTrackingEvent),

  getEstimatedDeliveryTime: (shipment) => {
    // The estimated window for time of delivery. May be periodically updated based on available in-flight shipment information.
    if (shipment.estimatedDeliveryTimeWindow.type === "ESTIMATED_DELIVERY") {
      return Date.parse(shipment.estimatedDeliveryTimeWindow.window.begins);
    }

    // The standard committed window of time by which the package is expected to be delivered.
    if (shipment.standardTransitTimeWindow.type === "ESTIMATED_DELIVERY") {
      return Date.parse(shipment.standardTransitTimeWindow.window.begins);
    }
  },
};

const fetchTracking = async (baseURL: string, trackingNumber: string) => {
  const token = await clientCredentialsTokenRequest({
    url: `${baseURL}/oauth/token`,

    client_id: process.env.FEDEX_CLIENT_ID!,
    client_secret: process.env.FEDEX_CLIENT_SECRET!,
  });

  const { data } = await axios(`${baseURL}/track/v1/trackingnumbers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: JSON.stringify({
      includeDetailedScans: true,
      trackingInfo: [{ trackingNumberInfo: { trackingNumber } }],
    }),
  });

  return data;
};

export const FedEx: Courier<"FedEx", "fedex"> = {
  name: "FedEx",
  code: "fedex",
  requiredEnvVars: ["FEDEX_CLIENT_ID", "FEDEX_CLIENT_SECRET"],
  fetchOptions: {
    urls: {
      dev: "https://apis-sandbox.fedex.com",
      prod: "https://apis.fedex.com",
    },
    fetchTracking,
  },
  parseOptions,
  tsTrackingNumberCouriers: [fedex],
};
