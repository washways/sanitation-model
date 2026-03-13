import React from 'react';
import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer';
import { DataSourceMap, ModelInputs, ModelOutputs } from '../types';
import { formatCurrency, formatNumber } from '../utils/calculations';
import { getFallbackSources } from '../utils/dataSources';
import { getAdvocacySummary } from '../utils/export';

interface SanitationReportProps {
  countryName: string;
  inputs: ModelInputs;
  outputs: ModelOutputs;
  sources: DataSourceMap;
}

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#0f4c81',
    color: '#ffffff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
  },
  eyebrow: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
    opacity: 0.85,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 1.35,
    opacity: 0.95,
  },
  grid: {
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  card: {
    flexGrow: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    border: '1 solid #dbeafe',
  },
  cardLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#475569',
    marginBottom: 6,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 700,
    color: '#0f172a',
  },
  cardSubvalue: {
    fontSize: 10,
    color: '#475569',
    marginTop: 4,
  },
  sectionRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
  },
  section: {
    flexGrow: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    border: '1 solid #e2e8f0',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 10,
    color: '#0f4c81',
    textTransform: 'uppercase',
  },
  driverRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottom: '1 solid #e2e8f0',
  },
  driverLabel: {
    fontSize: 10,
    color: '#1e293b',
    width: '44%',
  },
  driverValue: {
    fontSize: 10,
    fontWeight: 700,
    color: '#0f172a',
    width: '32%',
    textAlign: 'right',
  },
  driverShare: {
    fontSize: 10,
    color: '#475569',
    width: '18%',
    textAlign: 'right',
  },
  bullet: {
    marginBottom: 8,
    lineHeight: 1.4,
    color: '#334155',
  },
  callout: {
    marginTop: 12,
    backgroundColor: '#ecfeff',
    borderRadius: 12,
    padding: 12,
    border: '1 solid #bae6fd',
  },
  calloutTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#0f4c81',
    marginBottom: 6,
  },
  footer: {
    marginTop: 14,
    paddingTop: 10,
    borderTop: '1 solid #cbd5e1',
    fontSize: 8,
    color: '#64748b',
    lineHeight: 1.35,
  },
});

export const SanitationReport: React.FC<SanitationReportProps> = ({ countryName, inputs, outputs, sources }) => {
  const summary = getAdvocacySummary(outputs);
  const fallbackSources = getFallbackSources(sources)
    .filter(([key]) => key !== 'analysisYear')
    .slice(0, 4);

  return (
    <Document title={`${countryName} Sanitation Advocacy Brief`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Sanitation Economic Burden Brief</Text>
          <Text style={styles.title}>{countryName}</Text>
          <Text style={styles.subtitle}>
            Poor sanitation is estimated to cost {countryName} {summary.headline}, equivalent to {summary.percentGdp}.
            Results are aligned to {inputs.macro.analysisYear} source data where available.
          </Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Annual Economic Loss</Text>
            <Text style={styles.cardValue}>{formatCurrency(outputs.totalCostUSD)}</Text>
            <Text style={styles.cardSubvalue}>Across health, productivity, mortality, time, climate, and tourism channels.</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Local Currency</Text>
            <Text style={styles.cardValue}>{formatCurrency(outputs.totalCostLocal, inputs.macro.currencyCode)}</Text>
            <Text style={styles.cardSubvalue}>Converted using the current USD exchange rate available at runtime.</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Share of National GDP</Text>
            <Text style={styles.cardValue}>{formatNumber(outputs.percentGDP)}%</Text>
            <Text style={styles.cardSubvalue}>A recurring annual drag on growth, fiscal space, and household welfare.</Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Largest Cost Drivers</Text>
            {summary.topDrivers.map((driver) => (
              <View key={driver.key} style={styles.driverRow}>
                <Text style={styles.driverLabel}>{driver.label}</Text>
                <Text style={styles.driverValue}>{formatCurrency(driver.value)}</Text>
                <Text style={styles.driverShare}>{formatNumber(driver.share)}%</Text>
              </View>
            ))}
            <View style={styles.callout}>
              <Text style={styles.calloutTitle}>Advocacy Message</Text>
              <Text style={styles.bullet}>
                Sanitation is not only a service-delivery issue. It is a material economic burden that suppresses productivity,
                raises avoidable health costs, and weakens resilience.
              </Text>
              <Text style={styles.bullet}>
                The model points to the largest annual losses first, helping frame sanitation investment as a fiscal and growth decision.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Integrity</Text>
            <Text style={styles.bullet}>
              Calculations are aligned to {inputs.macro.analysisYear} to reduce mixed-year distortion across indicators.
            </Text>
            <Text style={styles.bullet}>
              GDP per capita, population, open defecation, stunting, tourism, mortality, and health expenditure inputs were pulled from World Bank time series and pinned to the aligned year when available.
            </Text>
            <Text style={styles.bullet}>
              {fallbackSources.length > 0
                ? `Fallback years were required for ${fallbackSources.length} indicator(s): ${fallbackSources.map(([, source]) => `${source.label}${source.actualYear ? ` (${source.actualYear})` : ''}`).join(', ')}.`
                : 'No earlier-year World Bank fallbacks were required for the displayed input set.'}
            </Text>
            <Text style={styles.bullet}>
              Analysts can export the companion CSV to review every parameter, its source, and the exact year used in the model.
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Generated by the Sanitation Impact Modeler on {new Date().toLocaleDateString('en-US')}. This brief is designed for advocacy use and should be interpreted alongside the detailed CSV export, which includes all parameters, source notes, and data-year metadata.
        </Text>
      </Page>
    </Document>
  );
};

export const downloadAdvocacyPdf = async (props: SanitationReportProps) => {
  const blob = await pdf(<SanitationReport {...props} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${props.countryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-sanitation-brief.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
