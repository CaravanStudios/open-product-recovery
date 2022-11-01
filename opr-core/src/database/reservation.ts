import { Interval } from "./interval";

export default interface Reservation extends Interval {
  reservingOrgUrl: string;
}