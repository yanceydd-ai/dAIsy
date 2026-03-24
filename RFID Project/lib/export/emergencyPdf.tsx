import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ExportStudent } from './exportService';

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, padding: 32, color: '#3E3E3F' },
  header: { marginBottom: 16 },
  title: { fontSize: 14, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', marginBottom: 4 },
  subtitle: { fontSize: 9, color: '#6B7280', marginBottom: 2 },
  counts: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  countBox: { alignItems: 'center', padding: 8, borderRadius: 4, minWidth: 60 },
  countNum: { fontSize: 20, fontFamily: 'Helvetica-Bold' },
  countLabel: { fontSize: 7, textTransform: 'uppercase', letterSpacing: 1 },
  table: { borderTopWidth: 1, borderTopColor: '#D0D9D8', borderTopStyle: 'solid' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#D0D9D8', borderBottomStyle: 'solid', paddingVertical: 4 },
  headerRow: { backgroundColor: '#F4F6F5', fontFamily: 'Helvetica-Bold' },
  col: { flex: 1, paddingHorizontal: 4 },
  colStatus: { width: 52, paddingHorizontal: 4 },
  colGrade: { width: 36, paddingHorizontal: 4 },
  colTime: { width: 52, paddingHorizontal: 4 },
  colDoor: { width: 52, paddingHorizontal: 4 },
  missingRow: { backgroundColor: '#FDF2F2' },
  unknownRow: { backgroundColor: '#F0F7F8' },
  footer: { position: 'absolute', bottom: 24, left: 32, right: 32, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: '#6B7280' },
});

function statusLabel(s: ExportStudent): string {
  if (s.manualOverride) return 'MANUAL';
  return s.state.toUpperCase();
}

function formatTs(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

interface Props {
  label: string;
  timestamp: string;
  userUpn: string;
  sorted: ExportStudent[];
}

export function buildEmergencyPdf({ label, timestamp, userUpn, sorted }: Props) {
  const presentCount = sorted.filter((s) => s.state === 'present').length;
  const missingCount = sorted.filter((s) => s.state === 'missing').length;
  const unknownCount = sorted.filter((s) => s.state === 'unknown').length;
  const formattedTs = new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>The Hockaday School — Emergency Roster</Text>
          <Text style={styles.subtitle}>{label}</Text>
          <Text style={styles.subtitle}>Exported: {formattedTs}</Text>
        </View>

        <View style={styles.counts}>
          <View style={[styles.countBox, { backgroundColor: '#EDF7EE' }]}>
            <Text style={[styles.countNum, { color: '#519B57' }]}>{presentCount}</Text>
            <Text style={[styles.countLabel, { color: '#519B57' }]}>Present</Text>
          </View>
          <View style={[styles.countBox, { backgroundColor: '#FDF2F2' }]}>
            <Text style={[styles.countNum, { color: '#BF202A' }]}>{missingCount}</Text>
            <Text style={[styles.countLabel, { color: '#BF202A' }]}>Missing</Text>
          </View>
          <View style={[styles.countBox, { backgroundColor: '#F0F7F8' }]}>
            <Text style={[styles.countNum, { color: '#84B9BF' }]}>{unknownCount}</Text>
            <Text style={[styles.countLabel, { color: '#84B9BF' }]}>Unknown</Text>
          </View>
        </View>

        <View style={styles.table}>
          {/* Header */}
          <View style={[styles.tableRow, styles.headerRow]}>
            <Text style={styles.colStatus}>Status</Text>
            <Text style={styles.col}>Last Name</Text>
            <Text style={styles.col}>First Name</Text>
            <Text style={styles.colGrade}>Grade</Text>
            <Text style={styles.colTime}>Last Seen</Text>
            <Text style={styles.colDoor}>Door</Text>
          </View>
          {sorted.map((s) => (
            <View
              key={s.studentId}
              style={[
                styles.tableRow,
                s.state === 'missing' ? styles.missingRow : s.state === 'unknown' ? styles.unknownRow : {},
              ]}
            >
              <Text style={styles.colStatus}>{statusLabel(s)}</Text>
              <Text style={styles.col}>{s.lastName}</Text>
              <Text style={styles.col}>{s.firstName}</Text>
              <Text style={styles.colGrade}>{s.grade}</Text>
              <Text style={styles.colTime}>{formatTs(s.lastCrossingTs)}</Text>
              <Text style={styles.colDoor}>{s.lastCrossingDoor ?? '—'}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Generated {formattedTs} by {userUpn}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
