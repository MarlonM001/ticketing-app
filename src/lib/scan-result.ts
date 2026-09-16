export type ScanResult = {
  result: "ok_in" | "ok_out" | "pending" | "invalid";
  guest_name: string | null;
  ticket_type_name: string | null;
  scanned_at: string | null;
};
