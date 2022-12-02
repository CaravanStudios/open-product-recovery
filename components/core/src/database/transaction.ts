export interface Transaction {
  commit(): Promise<void>;
  fail(): Promise<void>;
}
