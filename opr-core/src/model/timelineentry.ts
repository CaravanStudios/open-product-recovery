import {ReshareChain} from 'opr-models';
import {Interval} from './interval';

export interface TimelineEntry extends Interval {
  targetOrganizationUrl: string;
  offerId: string;
  postingOrgUrl: string;
  offerUpdateTimestampUTC: number;
  startTimeUTC: number;
  endTimeUTC: number;
  isReservation: boolean;
  reshareChain?: ReshareChain;
}
