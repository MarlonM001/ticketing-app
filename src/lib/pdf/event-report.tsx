import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 10, color: "#666", marginBottom: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  statsRow: { flexDirection: "row", marginBottom: 16 },
  statBox: { flex: 1, borderWidth: 1, borderColor: "#ddd", padding: 8, marginRight: 8 },
  statLabel: { fontSize: 8, color: "#666", textTransform: "uppercase" },
  statValue: { fontSize: 16, fontFamily: "Helvetica-Bold", marginTop: 2 },
  table: { display: "flex", width: "auto" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eee", paddingVertical: 4 },
  tableHeaderRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#000", paddingBottom: 4, fontFamily: "Helvetica-Bold" },
  col: { flex: 1 },
});

const ars = (cents: number) => `$${(cents / 100).toLocaleString("es-AR")}`;

export type EventReportData = {
  eventName: string;
  venue: string | null;
  generatedAt: string;
  stats: {
    totalTickets: number;
    checkedIn: number;
    revenueCents: number;
    barRevenueCents: number;
    totalRevenueCents: number;
  };
  breakdown: { name: string; qty: number; revenueCents: number }[];
  rrpp: { name: string; totalTickets: number; usedTickets: number; revenueCents: number }[];
  attendees: { name: string; ticketType: string; scannedAt: string }[];
  products: { name: string; qty: number; courtesyQty: number; revenueCents: number }[];
  staffAttendance: { role: string; total: number; checkedIn: number }[];
  staffSettlement: {
    username: string;
    role: string;
    payCents: number;
    consumedCents: number;
    creditCents: number;
    netPayCents: number;
  }[];
};

const ROLE_LABEL: Record<string, string> = {
  puerta: "Puerta",
  caja: "Caja",
  mesero: "Mesero",
  dj: "DJ",
};

export function EventReportDocument({ data }: { data: EventReportData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{data.eventName}</Text>
        <Text style={styles.subtitle}>
          {data.venue ? `${data.venue} · ` : ""}Reporte generado el{" "}
          {new Date(data.generatedAt).toLocaleString("es-AR")}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Ventas de entradas</Text>
            <Text style={styles.statValue}>{ars(data.stats.revenueCents)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Consumo de barra (pagado)</Text>
            <Text style={styles.statValue}>{ars(data.stats.barRevenueCents)}</Text>
          </View>
          <View style={[styles.statBox, { marginRight: 0 }]}>
            <Text style={styles.statLabel}>Total general</Text>
            <Text style={styles.statValue}>{ars(data.stats.totalRevenueCents)}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Entradas vendidas</Text>
            <Text style={styles.statValue}>{data.stats.totalTickets}</Text>
          </View>
          <View style={[styles.statBox, { marginRight: 0 }]}>
            <Text style={styles.statLabel}>Asistencia</Text>
            <Text style={styles.statValue}>
              {data.stats.checkedIn} / {data.stats.totalTickets}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distribución por tipo de entrada</Text>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.col}>Tipo</Text>
            <Text style={styles.col}>Cantidad</Text>
            <Text style={styles.col}>Recaudación</Text>
          </View>
          {data.breakdown.map((b, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.col}>{b.name}</Text>
              <Text style={styles.col}>{b.qty}</Text>
              <Text style={styles.col}>{ars(b.revenueCents)}</Text>
            </View>
          ))}
        </View>

        {data.rrpp.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ventas por RRPP</Text>
            <View style={styles.tableHeaderRow}>
              <Text style={styles.col}>Vendedor</Text>
              <Text style={styles.col}>Total</Text>
              <Text style={styles.col}>Usados</Text>
              <Text style={styles.col}>Recaudación</Text>
            </View>
            {data.rrpp.map((r, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.col}>{r.name}</Text>
                <Text style={styles.col}>{r.totalTickets}</Text>
                <Text style={styles.col}>{r.usedTickets}</Text>
                <Text style={styles.col}>{ars(r.revenueCents)}</Text>
              </View>
            ))}
          </View>
        )}

        {data.products.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Consumo en barra</Text>
            <View style={styles.tableHeaderRow}>
              <Text style={styles.col}>Producto</Text>
              <Text style={styles.col}>Cantidad</Text>
              <Text style={styles.col}>Cortesías (libre)</Text>
              <Text style={styles.col}>Recaudación</Text>
            </View>
            {data.products.map((p, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.col}>{p.name}</Text>
                <Text style={styles.col}>{p.qty}</Text>
                <Text style={styles.col}>{p.courtesyQty > 0 ? p.courtesyQty : "—"}</Text>
                <Text style={styles.col}>{ars(p.revenueCents)}</Text>
              </View>
            ))}
          </View>
        )}

        {data.staffSettlement.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Staff — sueldos y descuentos</Text>
            <View style={styles.tableHeaderRow}>
              <Text style={styles.col}>Usuario</Text>
              <Text style={styles.col}>Rol</Text>
              <Text style={styles.col}>Sueldo</Text>
              <Text style={styles.col}>Descuento (consumo)</Text>
              <Text style={styles.col}>Crédito sin usar</Text>
              <Text style={styles.col}>Neto a pagar</Text>
            </View>
            {data.staffSettlement.map((s, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.col}>{s.username}</Text>
                <Text style={styles.col}>{ROLE_LABEL[s.role] ?? s.role}</Text>
                <Text style={styles.col}>{ars(s.payCents)}</Text>
                <Text style={styles.col}>{ars(s.consumedCents)}</Text>
                <Text style={styles.col}>{ars(s.creditCents)}</Text>
                <Text style={styles.col}>{ars(s.netPayCents)}</Text>
              </View>
            ))}
          </View>
        )}

        {data.staffAttendance.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Asistencia de staff</Text>
            <View style={styles.tableHeaderRow}>
              <Text style={styles.col}>Rol</Text>
              <Text style={styles.col}>Presentes</Text>
              <Text style={styles.col}>Total</Text>
            </View>
            {data.staffAttendance.map((s, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.col}>{ROLE_LABEL[s.role] ?? s.role}</Text>
                <Text style={styles.col}>{s.checkedIn}</Text>
                <Text style={styles.col}>{s.total}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Ingresos registrados ({data.attendees.length})
          </Text>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.col}>Nombre</Text>
            <Text style={styles.col}>Tipo</Text>
            <Text style={styles.col}>Hora de ingreso</Text>
          </View>
          {data.attendees.map((a, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.col}>{a.name}</Text>
              <Text style={styles.col}>{a.ticketType}</Text>
              <Text style={styles.col}>
                {new Date(a.scannedAt).toLocaleString("es-AR")}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
