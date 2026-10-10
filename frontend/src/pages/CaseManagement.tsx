import React, { useMemo, useState } from 'react';
import { Archive, Search, FolderOpen, Trash2, Clock3, ShieldCheck, X, Save } from 'lucide-react';
import { SavedInvestigationCase } from '../types';
import { writeSavedCases } from '../services/caseStorage';
import styles from './CaseManagement.module.css';

interface CaseManagementProps {
  cases: SavedInvestigationCase[];
  onCasesChange: (cases: SavedInvestigationCase[]) => void;
  onReopen: (record: SavedInvestigationCase) => void;
}


export const CaseManagement: React.FC<CaseManagementProps> = ({ cases, onCasesChange, onReopen }) => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [selected, setSelected] = useState<SavedInvestigationCase | null>(null);
  const [notice, setNotice] = useState('');
  const filtered = useMemo(() => cases.filter(record => {
    const matchesQuery = `${record.caseId} ${record.caseName} ${record.verdict}`.toLowerCase().includes(query.toLowerCase());
    const decisions = record.reviews.map(item => item.decision);
    const reviewed = decisions.length > 0 && decisions.every(item => item !== 'PENDING');
    const matchesStatus = status === 'ALL' || (status === 'REVIEWED' ? reviewed : !reviewed);
    return matchesQuery && matchesStatus;
  }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [cases, query, status]);

  const removeCase = (record: SavedInvestigationCase) => {
    if (!window.confirm(`Delete saved case ${record.caseId}? This cannot be undone.`)) return;
    const next = cases.filter(item => item.caseId !== record.caseId);
    try { writeSavedCases(next); onCasesChange(next); setNotice('Case deleted.'); if (selected?.caseId === record.caseId) setSelected(null); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Unable to delete case.'); }
  };

  const saveEditedCase = () => {
    if (!selected) return;
    const next = cases.map(item => item.caseId === selected.caseId ? { ...selected, updatedAt: new Date().toISOString() } : item);
    try { writeSavedCases(next); onCasesChange(next); setSelected(null); setNotice('Case details saved.'); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Unable to save case.'); }
  };

  return <section className={styles.page}>
    <header className={styles.header}>
      <div><div className={styles.eyebrow}>CASE OPERATIONS / DAY 7</div><h1>Analyst Case Management</h1><p>Search, review, reopen, and maintain saved investigation records.</p></div>
      <div className={styles.count}><Archive size={18} /><strong>{cases.length}</strong><span>Saved cases</span></div>
    </header>
    <div className={styles.notice}><ShieldCheck size={17} /><span>Case records are saved in this browser profile. Original rule-engine findings remain preserved separately from analyst decisions.</span></div>
    {notice && <div className={styles.feedback} role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss message"><X size={14} /></button></div>}
    <div className={styles.filters}>
      <label className={styles.search}><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search case ID, name, or verdict" aria-label="Search cases" /></label>
      <label className={styles.filterLabel}>Review status<select value={status} onChange={e => setStatus(e.target.value)}><option value="ALL">All cases</option><option value="PENDING">Pending review</option><option value="REVIEWED">Fully reviewed</option></select></label>
    </div>
    {filtered.length === 0 ? <div className={styles.empty}><FolderOpen size={34} /><h2>{cases.length === 0 ? 'No saved cases yet' : 'No matching cases'}</h2><p>{cases.length === 0 ? 'Run an investigation, review its findings, and save it to create your first case record.' : 'Try another search term or review-status filter.'}</p></div> :
      <div className={styles.list}>{filtered.map(record => {
        const pending = record.reviews.filter(item => item.decision === 'PENDING').length;
        return <article className={styles.caseCard} key={record.caseId}>
          <div className={styles.caseTop}><span className={styles.caseId}>{record.caseId}</span><span className={pending ? styles.pending : styles.reviewed}>{pending ? `${pending} finding(s) pending` : 'Review complete'}</span></div>
          <h2>{record.caseName}</h2><p className={styles.verdict}>{record.verdict.replace(/_/g, ' ')}</p>
          <div className={styles.meta}><span><Clock3 size={14} />{new Date(record.updatedAt).toLocaleString()}</span><span>{record.totalEventsAnalyzed} events</span><span>{record.originalAnalysis.findings.length} findings</span></div>
          <div className={styles.actions}><button className={styles.primary} onClick={() => onReopen(record)}><FolderOpen size={15} /> Reopen case</button><button className={styles.secondary} onClick={() => setSelected({ ...record })}><Save size={15} /> Edit details</button><button className={styles.danger} onClick={() => removeCase(record)} aria-label={`Delete ${record.caseId}`}><Trash2 size={15} /></button></div>
        </article>;
      })}</div>}
    {selected && <div className={styles.overlay} role="presentation" onClick={() => setSelected(null)}><section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="case-edit-title" onClick={e => e.stopPropagation()}><div className={styles.modalHead}><h2 id="case-edit-title">Edit case details</h2><button onClick={() => setSelected(null)} aria-label="Close"><X size={18} /></button></div><label>Case ID<input value={selected.caseId} readOnly /></label><label>Case name<input value={selected.caseName} onChange={e => setSelected({ ...selected, caseName: e.target.value })} maxLength={100} /></label><label>Analyst case notes<textarea value={selected.analystNotes} onChange={e => setSelected({ ...selected, analystNotes: e.target.value })} rows={4} /></label><div className={styles.modalActions}><button className={styles.secondary} onClick={() => setSelected(null)}>Cancel</button><button className={styles.primary} onClick={saveEditedCase}><Save size={15} /> Save changes</button></div></section></div>}
  </section>;
};
