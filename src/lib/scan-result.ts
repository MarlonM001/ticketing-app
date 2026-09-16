export type ScanResult = {
  result: "ok_in" | "ok_out" | "pending" | "invalid" | "reentry_expired";
  guest_name: string | null;
  ticket_type_name: string | null;
  scanned_at: string | null;
};
