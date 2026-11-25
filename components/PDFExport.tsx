import React from 'react';
import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer';
import { DataSourceMap, DataSourceInfo, ModelInputs, ModelOutputs, YearExplanation } from '../types';
import { costEntries, formatNumber } from '../utils/calculations';
import { COST_LABELS } from '../utils/export';
import { runSimulation } from '../utils/monteCarlo';
import { COLOR_PALETTE } from '../constants';

interface SanitationReportProps {
  countryName: string;
  inputs: ModelInputs;
  outputs: ModelOutputs;
  sources: DataSourceMap;
  yearExplanation: YearExplanation | null;
  dataYear: number;
  version: string;
}

// WASHways palette (matches tailwind.config.js).
const C = {
  navy: '#263238',
  navySub: '#9FB0B6',
  tab: '#26A6C1',
  teal: '#0B6E80',
  tealTint: '#E8F2F4',
  page: '#EEF1F2',
  line: '#DDE2E4',
  text: '#17181a',
  body: '#334155',
  muted: '#64748b',
  amber: '#92400e',
};

// Built-in PDF fonts: Helvetica / Helvetica-Bold (fontWeight alone does not switch the face).
const BOLD = 'Helvetica-Bold';

const s = StyleSheet.create({
  // NB: set lineHeight per text style. react-pdf resolves an inherited lineHeight against the
  // parent's font size, so large text inheriting it from the page overlaps the next line.
  page: { paddingTop: 0, paddingBottom: 44, paddingHorizontal: 0, fontFamily: 'Helvetica', fontSize: 9.5, color: C.body },
  header: { backgroundColor: C.navy, paddingVertical: 18, paddingHorizontal: 40, marginBottom: 16 },
  eyebrow: { fontSize: 7.5, lineHeight: 1.2, fontFamily: BOLD, color: C.navySub, letterSpacing: 1, textTransform: 'uppercase' },
  title: { fontSize: 20, lineHeight: 1.2, fontFamily: BOLD, color: '#ffffff', marginTop: 6 },
  meta: { fontSize: 8.5, lineHeight: 1.3, color: '#d5dde0', marginTop: 4 },
  accent: { height: 3, width: 48, backgroundColor: C.tab, marginTop: 10 },
  body: { paddingHorizontal: 40 },

  statsRow: { flexDirection: 'row', marginBottom: 14 },
  stat: { flex: 1, borderWidth: 1, borderColor: C.line, borderRadius: 6, padding: 12 },
  statGap: { width: 10 },
  statLabel: { fontSize: 7.5, lineHeight: 1.2, fontFamily: BOLD, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  statValue: { fontSize: 17, lineHeight: 1.2, fontFamily: BOLD, color: C.text, marginTop: 5 },
  statSub: { fontSize: 8.5, lineHeight: 1.3, color: C.muted, marginTop: 3 },

  lead: { fontSize: 10.5, color: C.text, lineHeight: 1.5, marginBottom: 14 },

  h2: { fontSize: 11.5, lineHeight: 1.2, fontFamily: BOLD, color: C.text, marginBottom: 6, marginTop: 2 },
  section: { marginBottom: 14 },
  para: { fontSize: 9.5, lineHeight: 1.45, marginBottom: 5 },
  small: { fontSize: 8.5, lineHeight: 1.4, color: C.muted },

  tableHead: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 4, marginBottom: 1 },
  th: { fontSize: 7.5, lineHeight: 1.2, fontFamily: BOLD, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3.5, borderBottomWidth: 0.5, borderBottomColor: C.line },
  cellText: { fontSize: 9, lineHeight: 1.3, color: C.text },

  barTrack: { height: 6, backgroundColor: C.page, borderRadius: 3, flex: 1, marginHorizontal: 8 },
  bar: { height: 6, borderRadius: 3 },

  note: { backgroundColor: C.tealTint, borderRadius: 6, padding: 10, marginTop: 6 },
  noteText: { fontSize: 8.5, lineHeight: 1.4, color: C.body },

  footerRule: { position: 'absolute', bottom: 30, left: 40, right: 40, height: 0.5, backgroundColor: C.line },
  footerText: { position: 'absolute', bottom: 18, fontSize: 7.5, lineHeight: 1.2, color: C.muted },
});

/** Lower-case a label for use mid-sentence, but leave acronyms ("GDP per capita") alone. */
const inSentence = (label: string) => (/^[A-Z][a-z]/.test(label) ? label[0].toLowerCase() + label.slice(1) : label);
const listJoin = (items: string[]) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);

/** "US$180.1 million", "MWK 314.1 billion" — readable and never too wide for a cell. */
const money = (value: number, currency = 'USD') => {
  const prefix = currency === 'USD' ? 'US$' : `${currency} `;
  const abs = Math.abs(value);
  const units: [number, string][] = [[1e12, 'trillion'], [1e9, 'billion'], [1e6, 'million']];
  for (const [size, word] of units) {
    if (abs >= size) return `${prefix}${(value / size).toLocaleString('en-US', { maximumFractionDigits: 1 })} ${word}`;
  }
  return `${prefix}${Math.round(value).toLocaleString('en-US')}`;
};

const pct = (fraction: number) => `${formatNumber(fraction * 100)}%`;

const sourceText = (src?: DataSourceInfo) => {
  if (!src) return 'Model input';
  const year = src.actualYear ? ` ${src.actualYear}` : '';
  switch (src.kind) {
    case 'api': return `World Bank${year}`;
    case 'live': return `Live rate${year}`;
    case 'derived': return `Derived${year}`;
    case 'estimate': return 'Model estimate';
    case 'assumption': return src.label;
    case 'user': return 'User input';
    default: return src.label;
  }
};

const Footer = ({ version }: { version: string }) => (
  <>
    <View style={s.footerRule} fixed />
    {/* Static text only: react-pdf's render-prop page numbers did not draw in testing. */}
    <Text style={[s.footerText, { left: 40, right: 40 }]} fixed>
      Sanitation Impact Modeler v{version} · washways.org/sanitation-model · Indicative estimate, not an official statistic
    </Text>
  </>
);

export const SanitationReport: React.FC<SanitationReportProps> = ({ countryName, inputs, outputs, sources, yearExplanation, dataYear, version }) => {
  const sim = runSimulation(inputs, 3000);
  const breakdown = costEntries(outputs)
    .map(([key, value]) => ({ key, label: COST_LABELS[key] ?? key, value, share: outputs.totalCostUSD > 0 ? value / outputs.totalCostUSD : 0 }))
    .sort((a, b) => b.value - a.value);
  const maxShare = Math.max(...breakdown.map((b) => b.share), 0.0001);
  const top = breakdown.slice(0, 3).map((b) => b.label.toLowerCase());
  const generated = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const keyInputs: [string, string, DataSourceInfo | undefined][] = [
    ['Population', Math.round(inputs.health.population).toLocaleString('en-US'), sources.population],
    ['GDP per person', money(inputs.macro.gdpPerCapita), sources.gdpPerCapita],
    ['Exchange rate', `${formatNumber(inputs.macro.exchangeRate)} ${inputs.macro.currencyCode} per US$`, sources.exchangeRate],
    ['Hourly wage', `US$${inputs.macro.hourlyWage.toFixed(2)}`, sources.hourlyWage],
    ['Diarrhoea caused by unsafe sanitation', pct(inputs.health.attributionToSanitation), sources.attributionToSanitation],
    ['Stunting (under-5)', pct(inputs.nutrition.stuntingPrevalence), sources.stuntingPrevalence],
    ['Stunting caused by unsafe sanitation', pct(inputs.nutrition.attributionStunting), sources.attributionStunting],
    ['Open defecation', pct(inputs.access.openDefecationPrevalence), sources.openDefecationPrevalence],
    ['Poor sanitation (carbon)', pct(inputs.carbon.percentWithPoorSanitation), sources.percentWithPoorSanitation],
    ['Deaths valued by', inputs.macro.mortalityMethod === 'vsl' ? `Value of statistical life (${inputs.macro.vslMultiplier}× GDP per person)` : `Human capital (lost output, ${pct(inputs.macro.discountRate)} discount rate)`, undefined],
  ];

  return (
    <Document title={`Cost of poor sanitation: ${countryName}`} author="WASHways" subject="Sanitation economic burden brief">
      <Page size="A4" style={s.page} wrap>
        <Footer version={version} />
        <View style={s.header}>
          <Text style={s.eyebrow}>WASHways · Sanitation economics brief</Text>
          <Text style={s.title}>The cost of poor sanitation: {countryName}</Text>
          <Text style={s.meta}>Estimate for data year {dataYear} · Generated {generated}</Text>
          <View style={s.accent} />
        </View>

        <View style={s.body}>
          <View style={s.statsRow} wrap={false}>
            <View style={s.stat}>
              <Text style={s.statLabel}>Annual economic loss</Text>
              <Text style={s.statValue}>{money(outputs.totalCostUSD)}</Text>
              <Text style={s.statSub}>{money(outputs.totalCostLocal, inputs.macro.currencyCode)}</Text>
            </View>
            <View style={s.statGap} />
            <View style={s.stat}>
              <Text style={s.statLabel}>Share of GDP</Text>
              <Text style={s.statValue}>{formatNumber(outputs.percentGDP)}%</Text>
              <Text style={s.statSub}>lost every year</Text>
            </View>
            <View style={s.statGap} />
            <View style={s.stat}>
              <Text style={s.statLabel}>Likely range (90%)</Text>
              <Text style={[s.statValue, { fontSize: 13, marginTop: 7 }]}>{money(sim.p5)} – {money(sim.p95)}</Text>
              <Text style={s.statSub}>from {sim.iterations.toLocaleString('en-US')} simulations</Text>
            </View>
          </View>

          <Text style={s.lead}>
            Poor sanitation is estimated to cost {countryName} about {money(outputs.totalCostUSD)} a year, equal to {formatNumber(outputs.percentGDP)}% of GDP.
            The largest losses come from {listJoin(top)}.
          </Text>

          <View style={s.section} wrap={false}>
            <Text style={s.h2}>Where the losses come from</Text>
            <View style={s.tableHead}>
              <Text style={[s.th, { width: '38%' }]}>Cost category</Text>
              <Text style={[s.th, { flex: 1 }]}> </Text>
              <Text style={[s.th, { width: 80, textAlign: 'right' }]}>US$ per year</Text>
              <Text style={[s.th, { width: 40, textAlign: 'right' }]}>Share</Text>
            </View>
            {breakdown.map((b) => (
              <View key={b.key} style={s.row} wrap={false}>
                <Text style={[s.cellText, { width: '38%' }]}>{b.label}</Text>
                <View style={s.barTrack}>
                  <View style={[s.bar, { width: `${(b.share / maxShare) * 100}%`, backgroundColor: (COLOR_PALETTE as Record<string, string>)[b.key] ?? C.teal }]} />
                </View>
                <Text style={[s.cellText, { width: 80, textAlign: 'right' }]}>{money(b.value)}</Text>
                <Text style={[s.cellText, { width: 40, textAlign: 'right', color: C.muted }]}>{formatNumber(b.share * 100)}%</Text>
              </View>
            ))}
            {!outputs.carbonIncluded && (
              <Text style={[s.small, { marginTop: 5 }]}>
                Not included: greenhouse gas emissions from sanitation, about {money(outputs.carbonCostUSD)} a year at US${inputs.carbon.socialCostOfCarbon} per tonne. This is worldwide climate damage, and basic pit latrines emit as much methane as unimproved ones, so it is not a cost of poor sanitation to this economy.
              </Text>
            )}
          </View>

          <View style={s.section} wrap={false}>
            <Text style={s.h2}>Why it matters</Text>
            <Text style={s.para}>
              Sanitation is an economic issue as well as a service-delivery one. These losses recur every year: avoidable health spending,
              working time lost to illness and to finding places to defecate, early deaths, and lower lifetime earnings for children who are stunted.
            </Text>
            <Text style={s.para}>
              Comparing these annual losses with the cost of extending and maintaining sanitation services helps frame investment as a growth and fiscal decision.
            </Text>
          </View>

          <View style={s.section} wrap={false}>
            <Text style={s.h2}>Which year the data are from</Text>
            <Text style={s.para}>
              The estimate uses {dataYear} data.{' '}
              {yearExplanation
                ? `${yearExplanation.rule}${yearExplanation.limiting.length ? ` For ${countryName}, ${listJoin(yearExplanation.limiting.map(inSentence))} ${yearExplanation.limiting.length > 1 ? 'have' : 'has'} no data after ${dataYear}.` : ''}`
                : 'Live World Bank data were not available, so default values were used.'}
            </Text>
            {yearExplanation && yearExplanation.core.some((c) => c.latestYear === null) && (
              <Text style={[s.para, { color: C.amber }]}>
                Some core World Bank series could not be loaded when this brief was generated ({yearExplanation.core.filter((c) => c.latestYear === null).map((c) => inSentence(c.label)).join(', ')}), so model estimates were used for them.
              </Text>
            )}
            {yearExplanation && yearExplanation.olderOrMissing.length > 0 && (
              <View style={s.note}>
                <Text style={s.noteText}>
                  <Text style={{ fontFamily: BOLD }}>Older or missing inputs: </Text>
                  {yearExplanation.olderOrMissing.map((o) => `${o.label} (${o.usedYear ?? 'no data, estimated'})`).join(', ')}.
                </Text>
              </View>
            )}
          </View>

          <View style={s.section} wrap={false}>
            <Text style={s.h2}>Key inputs</Text>
            <View style={s.tableHead}>
              <Text style={[s.th, { width: '30%' }]}>Input</Text>
              <Text style={[s.th, { flex: 1 }]}>Value</Text>
              <Text style={[s.th, { width: 110, textAlign: 'right' }]}>Source</Text>
            </View>
            {keyInputs.map(([label, value, src]) => (
              <View key={label} style={s.row} wrap={false}>
                <Text style={[s.cellText, { width: '30%' }]}>{label}</Text>
                <Text style={[s.cellText, { flex: 1, paddingRight: 8 }]}>{value}</Text>
                <Text style={[s.cellText, { width: 110, textAlign: 'right', color: src?.fallbackUsed ? C.amber : C.muted }]}>
                  {src ? sourceText(src) : 'User choice'}
                </Text>
              </View>
            ))}
          </View>

          <View style={s.section} wrap={false}>
            <Text style={s.h2}>Method and caveats</Text>
            <Text style={s.para}>
              Bottom-up cost-of-illness and human-capital approach, modelled on the World Bank Water and Sanitation Program economic studies.
              Inputs come from World Bank Open Data where available; the rest are model estimates or standard assumptions, which users can change in the tool.
            </Text>
            <Text style={s.small}>
              This is an indicative estimate for advocacy and planning, not an official statistic. The companion CSV export lists every input with its source, data year and notes.
            </Text>
          </View>
        </View>
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
