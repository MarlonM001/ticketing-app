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
  stats: { totalTickets: number; checkedIn: number; revenueCents: number };
  breakdown: { name: string; qty: number; revenueCents: number }[];
  rrpp: { name: string; totalTickets: number; usedTickets: number; revenueCents: number }[];
  attendees: { name: string; ticketType: string; scannedAt: string }[];
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
            <Text style={styles.statLabel}>Ventas</Text>
            <Text style={styles.statValue}>{ars(data.stats.revenueCents)}</Text>
          </View>
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
