import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 10, color: "#666", marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eee", paddingVertical: 4 },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 4,
    fontFamily: "Helvetica-Bold",
  },
  totalRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#000",
    marginTop: 2,
    paddingTop: 6,
    fontFamily: "Helvetica-Bold",
  },
  col: { flex: 1 },
  colWide: { flex: 1.6 },
  colNarrow: { flex: 0.8 },
});

const ars = (cents: number) => `$${(cents / 100).toLocaleString("es-AR")}`;

export type InventoryReportData = {
  eventName: string;
  generatedAt: string;
  products: {
    name: string;
    initialStock: number | null;
    finalStock: number | null;
    qty: number;
    courtesyQty: number;
    revenueCents: number;
  }[];
  totals: { qtySold: number; courtesyQty: number; revenueCents: number };
};

export function InventoryReportDocument({ data }: { data: InventoryReportData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{data.eventName}</Text>
        <Text style={styles.subtitle}>
          Inventario de barra · Reporte generado el{" "}
          {new Date(data.generatedAt).toLocaleString("es-AR")}
        </Text>

        <Text style={styles.sectionTitle}>Consumo en barra</Text>
        <View style={styles.tableHeaderRow}>
          <Text style={styles.colWide}>Producto</Text>
          <Text style={styles.colNarrow}>Inicial</Text>
          <Text style={styles.colNarrow}>Final</Text>
          <Text style={styles.colNarrow}>Vendido</Text>
          <Text style={styles.col}>Cortesías</Text>
          <Text style={styles.col}>Recaudación</Text>
        </View>
        {data.products.map((p, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.colWide}>{p.name}</Text>
            <Text style={styles.colNarrow}>{p.initialStock ?? "—"}</Text>
            <Text style={styles.colNarrow}>{p.finalStock ?? "—"}</Text>
            <Text style={styles.colNarrow}>{p.qty}</Text>
            <Text style={styles.col}>{p.courtesyQty > 0 ? p.courtesyQty : "—"}</Text>
            <Text style={styles.col}>{ars(p.revenueCents)}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.colWide}>Total</Text>
          <Text style={styles.colNarrow}>—</Text>
          <Text style={styles.colNarrow}>—</Text>
          <Text style={styles.colNarrow}>{data.totals.qtySold}</Text>
          <Text style={styles.col}>{data.totals.courtesyQty > 0 ? data.totals.courtesyQty : "—"}</Text>
          <Text style={styles.col}>{ars(data.totals.revenueCents)}</Text>
        </View>
      </Page>
    </Document>
  );
}
