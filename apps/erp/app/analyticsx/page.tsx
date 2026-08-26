'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authedFetch } from '../../lib/api';
import AppShell from '../../components/AppShell';

const TABS = [
  { key: 'kpis', label: 'KPIs' },
  { key: 'risk', label: 'Student Risk' },
  { key: 'reports', label: 'Reports' },
];

export default function AnalyticsXPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [tab, setTab] = useState('kpis');
  const [error, setError] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);

  const [kpis, setKpis] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  const [kpiForm, setKpiForm] = useState({ metricName: '', metricValue: '', snapshotDate: '' });
  const [riskForm, setRiskForm] = useState({ studentId: '', riskScore: '', riskCategory: 'LOW', contributingFactors: '', termId: '' });
  const [reportForm, setReportForm] = useState({ reportName: '', reportType: '' });

  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');

  useEffect(() => {
    const t = 'cookie';
    const userStr = sessionStorage.getItem('sukuu_user');
    if (!t) { router.push('/login'); return; }
    setToken(t); setUser(userStr ? JSON.parse(userStr) : null);
    loadAll(t);
  }, [router]);

  function loadAll(t: string) {
    authedFetch('/api/v1/school/profile', t).then(d => d && !d.error && setSchool(d));
    authedFetch('/api/v1/students', t).then(d => Array.isArray(d) ? setStudents(d) : setError(d?.error));
    authedFetch('/api/v1/academic/terms', t).then(d => Array.isArray(d) && setTerms(d));
    authedFetch('/api/v1/analytics/kpis', t).then(d => Array.isArray(d) && setKpis(d));
    authedFetch('/api/v1/analytics/student-risks', t).then(d => Array.isArray(d) && setRisks(d));
    authedFetch('/api/v1/analytics/reports', t).then(d => Array.isArray(d) && setReports(d));
    setSummaryLoading(true);
    authedFetch('/api/v1/analytics/summary', t)
      .then(d => { if (d && !d.error) { setSummary(d); setSummaryError(''); } else setSummaryError(d?.error || 'Failed to load summary'); })
      .catch(() => setSummaryError('Failed to load summary')).finally(() => setSummaryLoading(false));
  }

  function studentName(id: string) { const s = students.find(x => x.id === id); return s ? `${s.first_name} ${s.last_name}` : id?.slice(0, 8) || '—'; }
  async function post(url: string, body: any, resetFn: () => void) { await authedFetch(url, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); resetFn(); loadAll(token); }

  if (error) return <AppShell user={user}><div style={{ padding: 40, color: 'var(--er)' }}>{error}</div></AppShell>;

  return (
    <AppShell user={user} schoolName={school?.name}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">SUKUU ERP · ANALYTICSX · 4 TABLES · sukuux SCHEMA</div>
            <div className="ph-title">📊 AnalyticsX</div>
            <div className="ph-sub">Defined Measures · Dashboards · Scheduled Reports · Risk Signals · Exports</div>
          </div>
        </div>
      </div>

      {summaryError && <div style={{ padding: '0 var(--pad)', marginBottom: 'var(--gap)' }}><div className="alert al-er"><span className="al-ic">⚠️</span><div>Couldn't load the analytics overview: {summaryError}.</div></div></div>}

      {summaryLoading ? (
        <div className="fx-overview"><div className="stat-grid">{[1, 2, 3, 4].map(i => <div key={i} className="skel skel-card" />)}</div></div>
      ) : summary && (
        <div className="fx-overview">
          <div className="stat-grid">
            <button className="fx-card-btn" onClick={() => setTab('kpis')}>
              <div className="sc" title="KPI snapshot rows recorded"><div className="sc-top"><div className="sc-icon" style={{ background: 'var(--inB)' }}>📊</div></div><div className="sc-val">{summary.kpiCount}</div><div className="sc-lbl">KPI SNAPSHOTS</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('risk')}>
              <div className="sc" title="Student risk records flagged HIGH or CRITICAL"><div className="sc-top"><div className="sc-icon" style={{ background: summary.highRiskStudents > 0 ? 'var(--erB)' : 'var(--okB)' }}>🚨</div></div><div className="sc-val">{summary.highRiskStudents}</div><div className="sc-lbl">HIGH-RISK STUDENTS</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('reports')}>
              <div className="sc" title="Generated reports on record"><div className="sc-top"><div className="sc-icon" style={{ background: 'var(--puB)' }}>📄</div></div><div className="sc-val">{summary.totalReports}</div><div className="sc-lbl">REPORTS GENERATED</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('kpis')}>
              <div className="sc" title="Analytics events logged today"><div className="sc-top"><div className="sc-icon" style={{ background: 'var(--okB)' }}>⚡</div></div><div className="sc-val">{summary.eventsToday}</div><div className="sc-lbl">EVENTS TODAY</div></div>
            </button>
          </div>
        </div>
      )}

      <div className="sys-tabs">{TABS.map(t => <button key={t.key} className={`sys-tab-btn${tab === t.key ? ' act' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>)}</div>

      {tab === 'kpis' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/analytics/kpis', kpiForm, () => setKpiForm({ metricName: '', metricValue: '', snapshotDate: '' })); }}>
            <div className="ch"><span className="ch-t">KPI SNAPSHOTS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Metric name" value={kpiForm.metricName} onChange={e => setKpiForm({ ...kpiForm, metricName: e.target.value })} required style={{ flex: 1, minWidth: 160 }} />
              <input className="fi" type="number" step="0.01" placeholder="Value" value={kpiForm.metricValue} onChange={e => setKpiForm({ ...kpiForm, metricValue: e.target.value })} required style={{ width: 120 }} />
              <input className="fi" type="date" value={kpiForm.snapshotDate} onChange={e => setKpiForm({ ...kpiForm, snapshotDate: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Record</button>
            </div>
            <div className="tbl">
              <table className="data-table">
                <thead><tr><th>Metric</th><th>Value</th><th>Date</th></tr></thead>
                <tbody>
                  {kpis.map(k => <tr key={k.id}><td>{k.metric_name}</td><td>{k.metric_value}</td><td style={{ fontSize: 11 }}>{k.snapshot_date}</td></tr>)}
                  {kpis.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No KPI snapshots yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </form>
        </div>
      )}

      {tab === 'risk' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/analytics/student-risks', riskForm, () => setRiskForm({ studentId: '', riskScore: '', riskCategory: 'LOW', contributingFactors: '', termId: '' })); }}>
            <div className="ch"><span className="ch-t">STUDENT RISK SIGNALS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={riskForm.studentId} onChange={e => setRiskForm({ ...riskForm, studentId: e.target.value })} required><option value="">Student...</option>{students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
              <select className="fi" value={riskForm.termId} onChange={e => setRiskForm({ ...riskForm, termId: e.target.value })} required><option value="">Term...</option>{terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
              <input className="fi" type="number" step="0.01" placeholder="Score" value={riskForm.riskScore} onChange={e => setRiskForm({ ...riskForm, riskScore: e.target.value })} required style={{ width: 100 }} />
              <select className="fi" value={riskForm.riskCategory} onChange={e => setRiskForm({ ...riskForm, riskCategory: e.target.value })}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option></select>
              <input className="fi" placeholder="Contributing factors" value={riskForm.contributingFactors} onChange={e => setRiskForm({ ...riskForm, contributingFactors: e.target.value })} style={{ flex: 1, minWidth: 160 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Record</button>
            </div>
            <div className="tbl">
              <table className="data-table">
                <thead><tr><th>Student</th><th>Score</th><th>Category</th><th>Factors</th></tr></thead>
                <tbody>
                  {risks.map(r => <tr key={r.id}><td>{studentName(r.student_id)}</td><td>{r.risk_score}</td><td><span className={`bdg ${r.risk_category === 'CRITICAL' || r.risk_category === 'HIGH' ? 'ber' : r.risk_category === 'MEDIUM' ? 'bwn' : 'bok'}`}>{r.risk_category}</span></td><td style={{ fontSize: 12 }}>{r.contributing_factors || '—'}</td></tr>)}
                  {risks.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No risk signals recorded yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </form>
        </div>
      )}

      {tab === 'reports' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/analytics/reports', reportForm, () => setReportForm({ reportName: '', reportType: '' })); }}>
            <div className="ch"><span className="ch-t">GENERATED REPORTS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Report name" value={reportForm.reportName} onChange={e => setReportForm({ ...reportForm, reportName: e.target.value })} required style={{ flex: 1, minWidth: 160 }} />
              <input className="fi" placeholder="Type" value={reportForm.reportType} onChange={e => setReportForm({ ...reportForm, reportType: e.target.value })} required style={{ width: 160 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Generate</button>
            </div>
            {reports.map(r => <div key={r.id} className="ri na"><div className="ri-b"><div className="ri-t">{r.report_name}</div><div className="ri-s">{r.report_type} · {new Date(r.generated_at).toLocaleDateString()}</div></div></div>)}
            {reports.length === 0 && <div className="ri na"><div className="ri-s">No reports generated yet.</div></div>}
          </form>
        </div>
      )}
    </AppShell>
  );
}
