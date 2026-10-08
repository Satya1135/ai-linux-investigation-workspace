import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Clock,
  ShieldAlert,
  AlertTriangle,
  Loader2,
  FileCode,
  ArrowRight,
  RotateCcw,
  Layers,
  Search,
  Lock,
  Activity,
  ChevronRight,
  Filter,
  Copy,
  Check,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import {
  TimelineEvent,
  AttackStage,
  EventSeverity,
  NavSection,
  LogEventCandidate,
} from '../types';
import {
  analyzeTimeline,
  analyzeSampleTimeline,
} from '../services/api';
import styles from './InvestigationTimeline.module.css';

interface InvestigationTimelineProps {
  onNavigate?: (tab: NavSection) => void;
  incomingEvents?: LogEventCandidate[];
}

const ATTACK_STAGE_DEFINITIONS: { stage: AttackStage; number: string; label: string }[] = [
  { stage: 'AUTHENTICATION', number: '01', label: 'AUTHENTICATION' },
  { stage: 'RECONNAISSANCE', number: '02', label: 'RECONNAISSANCE' },
  { stage: 'PRIVILEGE_DISCOVERY', number: '03', label: 'PRIVILEGE DISCOVERY' },
  { stage: 'PRIVILEGE_ESCALATION', number: '04', label: 'PRIVILEGE ESCALATION' },
  { stage: 'EXECUTION', number: '05', label: 'EXECUTION' },
  { stage: 'PERSISTENCE', number: '06', label: 'PERSISTENCE' },
  { stage: 'POST_EXPLOITATION', number: '07', label: 'POST-EXPLOITATION' },
  { stage: 'OTHER', number: '08', label: 'OTHER ACTIVITY' },
];

export const InvestigationTimeline: React.FC<InvestigationTimelineProps> = ({
  onNavigate,
  incomingEvents,
}) => {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [stagesDetected, setStagesDetected] = useState<AttackStage[]>([]);
  const [suspiciousCount, setSuspiciousCount] = useState<number>(0);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filtering State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeStageFilter, setActiveStageFilter] = useState<AttackStage | 'ALL'>('ALL');
  const [suspiciousOnlyFilter, setSuspiciousOnlyFilter] = useState<boolean>(false);
  const [hasCopiedMessage, setHasCopiedMessage] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-analyze incoming events if provided from Evidence Intake
  useEffect(() => {
    if (incomingEvents && incomingEvents.length > 0) {
      handleAnalyzeEvents(incomingEvents);
    }
  }, [incomingEvents]);

  const handleAnalyzeEvents = async (events: LogEventCandidate[]) => {
    setErrorMessage(null);
    setIsLoading(true);
    setLoadingMessage('Constructing chronological timeline and mapping attack stages...');
    try {
      const resp = await analyzeTimeline(events);
      setTimelineEvents(resp.timeline);
      setStagesDetected(resp.stages_detected);
      setSuspiciousCount(resp.suspicious_count);
      if (resp.timeline.length > 0) {
        const firstAlert = resp.timeline.find((e) => e.severity === 'CRITICAL' || e.suspicious);
        setSelectedEventId(firstAlert ? firstAlert.event_id : resp.timeline[0].event_id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to analyze timeline.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleLoadSampleTimeline = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    setLoadingMessage('Loading sample scenario and constructing investigation timeline...');
    try {
      const resp = await analyzeSampleTimeline('sample-privilege-escalation.log');
      setTimelineEvents(resp.timeline);
      setStagesDetected(resp.stages_detected);
      setSuspiciousCount(resp.suspicious_count);
      // Reset active filters on sample reload
      setActiveStageFilter('ALL');
      setSuspiciousOnlyFilter(false);
      setSearchQuery('');
      if (resp.timeline.length > 0) {
        const firstAlert = resp.timeline.find((e) => e.severity === 'CRITICAL' || e.suspicious);
        setSelectedEventId(firstAlert ? firstAlert.event_id : resp.timeline[0].event_id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load sample timeline.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleClearAllTimelineData = () => {
    setTimelineEvents([]);
    setStagesDetected([]);
    setSuspiciousCount(0);
    setSelectedEventId(null);
    setSearchQuery('');
    setActiveStageFilter('ALL');
    setSuspiciousOnlyFilter(false);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveStageFilter('ALL');
    setSuspiciousOnlyFilter(false);
    if (timelineEvents.length > 0) {
      const firstAlert = timelineEvents.find((e) => e.severity === 'CRITICAL' || e.suspicious);
      setSelectedEventId(firstAlert ? firstAlert.event_id : timelineEvents[0].event_id);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setHasCopiedMessage(true);
    setTimeout(() => setHasCopiedMessage(false), 2000);
  };

  // Filtered timeline events (Client-side fast evaluation with zero backend roundtrips)
  const filteredEvents = useMemo(() => {
    return timelineEvents.filter((evt) => {
      // 1. Stage filter
      if (activeStageFilter !== 'ALL' && evt.attack_stage !== activeStageFilter) {
        return false;
      }
      // 2. Suspicious only filter
      if (suspiciousOnlyFilter && !evt.suspicious) {
        return false;
      }
      // 3. Keyword / Field Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const msg = (evt.message || '').toLowerCase();
        const rawMsg = (evt.raw_message || '').toLowerCase();
        const proc = (evt.process || '').toLowerCase();
        const host = (evt.host || '').toLowerCase();
        const time = (evt.timestamp || '').toLowerCase();
        const type = (evt.event_type || '').toLowerCase();
        const reason = (evt.highlight_reason || '').toLowerCase();
        const indexStr = String(evt.original_event_index);
        const eventId = evt.event_id.toLowerCase();
        const stage = evt.attack_stage.toLowerCase();

        return (
          msg.includes(q) ||
          rawMsg.includes(q) ||
          proc.includes(q) ||
          host.includes(q) ||
          time.includes(q) ||
          type.includes(q) ||
          reason.includes(q) ||
          indexStr.includes(q) ||
          eventId.includes(q) ||
          stage.includes(q)
        );
      }
      return true;
    });
  }, [timelineEvents, activeStageFilter, suspiciousOnlyFilter, searchQuery]);

  // Synchronize selected event when filters change
  useEffect(() => {
    if (timelineEvents.length === 0) {
      setSelectedEventId(null);
      return;
    }

    if (filteredEvents.length === 0) {
      // No visible event matches current filter criteria
      setSelectedEventId(null);
    } else {
      // If current selection is not among filtered events, auto-select first visible event
      const isCurrentVisible = filteredEvents.some((e) => e.event_id === selectedEventId);
      if (!isCurrentVisible) {
        setSelectedEventId(filteredEvents[0].event_id);
      }
    }
  }, [filteredEvents, timelineEvents, selectedEventId]);

  // Selected event lookup
  const selectedEvent = useMemo(() => {
    if (!selectedEventId || filteredEvents.length === 0) return null;
    return filteredEvents.find((e) => e.event_id === selectedEventId) || null;
  }, [filteredEvents, selectedEventId]);

  // Stage counts derived from all loaded timeline events
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    timelineEvents.forEach((e) => {
      counts[e.attack_stage] = (counts[e.attack_stage] || 0) + 1;
    });
    return counts;
  }, [timelineEvents]);

  const hasActiveFilters = searchQuery.trim() !== '' || activeStageFilter !== 'ALL' || suspiciousOnlyFilter;

  const getSeverityBadgeClass = (sev: EventSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return styles.sevCritical;
      case 'HIGH':
        return styles.sevHigh;
      case 'MEDIUM':
        return styles.sevMedium;
      case 'LOW':
        return styles.sevLow;
      default:
        return styles.sevInfo;
    }
  };

  return (
    <div className={styles.container}>
      {/* 1. Tactical Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <div className={styles.headingRow}>
            <Clock size={22} className={styles.titleIcon} />
            <h1 className={styles.heading}>INVESTIGATION TIMELINE</h1>
            <div className={styles.statusBadge}>
              <span className={styles.liveDot} />
              <span>ANALYSIS READY</span>
            </div>
            <span className={styles.channelTag}>// ENGINE: DETERMINISTIC HEURISTICS (DAY 5)</span>
          </div>
          <p className={styles.subheading}>
            Chronological reconstruction of Linux security activity and attack progression
          </p>
        </div>

        <div className={styles.headerActions}>
          {timelineEvents.length === 0 ? (
            <button
              type="button"
              className={styles.tacticalBtnPrimary}
              onClick={handleLoadSampleTimeline}
              disabled={isLoading}
            >
              <FileCode size={16} />
              <span>ANALYZE SAMPLE TIMELINE</span>
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button
                type="button"
                className={styles.tacticalBtnSecondary}
                onClick={handleLoadSampleTimeline}
                disabled={isLoading}
                title="Reload sample timeline scenario (30 events)"
              >
                <FileCode size={14} />
                <span>SAMPLE (30 EVT)</span>
              </button>
              <button
                type="button"
                className={styles.tacticalBtnSecondary}
                onClick={handleClearAllTimelineData}
                title="Clear loaded timeline events"
              >
                <RotateCcw size={14} />
                <span>CLEAR TIMELINE</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className={styles.errorBanner} role="alert">
          <div className={styles.errorContent}>
            <AlertTriangle size={18} color="var(--accent-rose)" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            className={styles.dismissButton}
            onClick={() => setErrorMessage(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading Box */}
      {isLoading && (
        <div className={styles.loadingBox}>
          <Loader2 className={styles.spinIcon} size={32} />
          <div className={styles.loadingTextGroup}>
            <span className={styles.loadingTitle}>RECONSTRUCTING TIMELINE</span>
            <span className={styles.loadingSubtitle}>{loadingMessage}</span>
          </div>
        </div>
      )}

      {/* 2. Empty State (When no evidence is loaded) */}
      {!isLoading && timelineEvents.length === 0 && (
        <div className={styles.emptyStateContainer}>
          <div className={styles.emptyStateCard}>
            <div className={styles.emptyIconBox}>
              <Clock size={36} />
            </div>
            <h2 className={styles.emptyTitle}>NO INVESTIGATION EVIDENCE LOADED</h2>
            <p className={styles.emptySubtitle}>
              To reconstruct a chronological attack timeline and identify security anomalies, load or paste Linux log evidence in Evidence Intake, or analyze the pre-packaged forensic sample scenario.
            </p>
            <div className={styles.emptyActions}>
              <button
                type="button"
                className={styles.tacticalBtnPrimary}
                onClick={handleLoadSampleTimeline}
              >
                <FileCode size={16} />
                <span>ANALYZE SAMPLE TIMELINE (30 EVENTS)</span>
                <ArrowRight size={16} />
              </button>
              {onNavigate && (
                <button
                  type="button"
                  className={styles.tacticalBtnSecondary}
                  onClick={() => onNavigate('evidence')}
                >
                  <Layers size={14} />
                  <span>GO TO EVIDENCE INTAKE</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Three-Column Investigation Timeline Cockpit */}
      {!isLoading && timelineEvents.length > 0 && (
        <div className={styles.cockpitGrid}>
          {/* ==================================================== */}
          {/* COLUMN 1: ATTACK STAGE RAIL                          */}
          {/* ==================================================== */}
          <aside className={styles.stageRail}>
            <div className={styles.railHeader}>
              <div className={styles.railTitle}>
                <Layers size={15} color="var(--accent-cyan)" />
                <span>ATTACK STAGES</span>
              </div>
              <span className={styles.railBadge}>
                {stagesDetected.length} DETECTED
              </span>
            </div>

            <div className={styles.stageList}>
              <button
                type="button"
                className={`${styles.stageButton} ${activeStageFilter === 'ALL' ? styles.stageActive : ''}`}
                onClick={() => setActiveStageFilter('ALL')}
                title="Display all timeline events regardless of attack stage"
              >
                <span className={styles.stageNumber}>ALL</span>
                <span className={styles.stageLabel}>ALL TIMELINE EVENTS</span>
                <span className={styles.stageCountBadge}>{timelineEvents.length}</span>
              </button>

              {ATTACK_STAGE_DEFINITIONS.map(({ stage, number, label }) => {
                const count = stageCounts[stage] || 0;
                const isDetected = count > 0;
                const isActive = activeStageFilter === stage;
                return (
                  <button
                    key={stage}
                    type="button"
                    className={`${styles.stageButton} ${isActive ? styles.stageActive : ''} ${!isDetected ? styles.stageInactive : ''}`}
                    onClick={() => isDetected && setActiveStageFilter(stage)}
                    disabled={!isDetected}
                    title={
                      !isDetected
                        ? 'Stage not observed in current event telemetry'
                        : `Filter timeline to ${label} (${count} events)`
                    }
                  >
                    <span className={styles.stageNumber}>{number}</span>
                    <span className={styles.stageLabel}>{label}</span>
                    {isDetected ? (
                      <span
                        className={`${styles.stageCountBadge} ${
                          stage === 'PRIVILEGE_ESCALATION' || stage === 'POST_EXPLOITATION'
                            ? styles.badgeAlert
                            : ''
                        }`}
                      >
                        {count}
                      </span>
                    ) : (
                      <span className={styles.stageMutedDot}>-</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Suspicious Events Quick Filter Toggle */}
            <div className={styles.railFooter}>
              <button
                type="button"
                className={`${styles.suspiciousFilterBtn} ${
                  suspiciousOnlyFilter ? styles.suspiciousFilterActive : ''
                }`}
                onClick={() => setSuspiciousOnlyFilter(!suspiciousOnlyFilter)}
                title={
                  suspiciousOnlyFilter
                    ? 'Show all events'
                    : `Filter to only suspicious events (${suspiciousCount})`
                }
              >
                <ShieldAlert size={16} />
                <span>
                  {suspiciousOnlyFilter
                    ? `SUSPICIOUS ONLY [ON] (${suspiciousCount})`
                    : `SUSPICIOUS ONLY (${suspiciousCount})`}
                </span>
              </button>
            </div>
          </aside>

          {/* ==================================================== */}
          {/* COLUMN 2: CHRONOLOGICAL EVENTS TIMELINE              */}
          {/* ==================================================== */}
          <section className={styles.timelineStreamSection}>
            <div className={styles.streamHeader}>
              <div className={styles.streamControls}>
                <div className={styles.searchBox}>
                  <Search size={14} color="var(--text-muted)" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search logs, processes, hosts, rules, types..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className={styles.searchClearBtn}
                      onClick={() => {
                        setSearchQuery('');
                        searchInputRef.current?.focus();
                      }}
                      title="Clear search query"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div className={styles.streamStatsGroup}>
                  <div className={styles.streamStats}>
                    <span>
                      SHOWING <strong>{filteredEvents.length}</strong> OF {timelineEvents.length} EVENTS
                    </span>
                  </div>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      className={styles.resetFiltersBtn}
                      onClick={handleResetFilters}
                      title="Reset all search queries, stage filters, and suspicious toggles"
                    >
                      <RotateCcw size={11} />
                      <span>RESET FILTERS</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Active Filter Chips Bar */}
              {hasActiveFilters && (
                <div className={styles.filterChipsRow}>
                  <div className={styles.filterChipsLabel}>
                    <SlidersHorizontal size={12} />
                    <span>ACTIVE FILTERS:</span>
                  </div>

                  {activeStageFilter !== 'ALL' && (
                    <span className={styles.filterChip}>
                      STAGE: <strong>{activeStageFilter}</strong>
                      <button
                        type="button"
                        className={styles.chipRemoveBtn}
                        onClick={() => setActiveStageFilter('ALL')}
                        title="Remove stage filter"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  )}

                  {suspiciousOnlyFilter && (
                    <span className={`${styles.filterChip} ${styles.filterChipAlert}`}>
                      <ShieldAlert size={11} />
                      <span>SUSPICIOUS ONLY</span>
                      <button
                        type="button"
                        className={styles.chipRemoveBtn}
                        onClick={() => setSuspiciousOnlyFilter(false)}
                        title="Remove suspicious only filter"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  )}

                  {searchQuery.trim() && (
                    <span className={styles.filterChip}>
                      SEARCH: <strong>"{searchQuery}"</strong>
                      <button
                        type="button"
                        className={styles.chipRemoveBtn}
                        onClick={() => setSearchQuery('')}
                        title="Clear search query"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className={styles.eventsScrollContainer}>
              <div className={styles.timelineTrackLine} />

              <div className={styles.timelineItemsList}>
                {filteredEvents.map((evt) => {
                  const isSelected = selectedEvent?.event_id === evt.event_id;
                  const isCritical = evt.severity === 'CRITICAL';
                  return (
                    <div
                      key={evt.event_id}
                      className={`${styles.eventCard} ${
                        isSelected ? styles.cardSelected : ''
                      } ${evt.suspicious ? styles.cardSuspicious : ''} ${
                        isCritical ? styles.cardCritical : ''
                      }`}
                      onClick={() => setSelectedEventId(evt.event_id)}
                    >
                      {/* Timeline Node Icon / Dot */}
                      <div
                        className={`${styles.timelineNode} ${
                          styles['node_' + evt.severity.toLowerCase()]
                        } ${isSelected ? styles.nodeActive : ''}`}
                      >
                        {isCritical ? (
                          <ShieldAlert size={12} color="#fff" />
                        ) : evt.suspicious ? (
                          <AlertTriangle size={11} color="var(--accent-amber)" />
                        ) : (
                          <span className={styles.innerDot} />
                        )}
                      </div>

                      <div className={styles.eventCardBody}>
                        <div className={styles.eventCardTop}>
                          <div className={styles.eventMetaLeft}>
                            <span className={styles.eventIndexTag}>#{evt.original_event_index}</span>
                            <span className={styles.eventTimestamp}>{evt.timestamp || 'No Timestamp'}</span>
                            {evt.process && (
                              <span className={styles.processChip}>
                                <code>{evt.process}</code>
                              </span>
                            )}
                          </div>
                          <div className={styles.eventMetaRight}>
                            <span
                              className={`${styles.sevBadge} ${getSeverityBadgeClass(
                                evt.severity
                              )}`}
                            >
                              {evt.severity}
                            </span>
                            <span className={styles.stageTag}>{evt.attack_stage}</span>
                          </div>
                        </div>

                        <div className={styles.eventMessagePreview}>
                          <code>{evt.message}</code>
                        </div>

                        {evt.suspicious && evt.highlight_reason && (
                          <div className={styles.highlightBanner}>
                            <AlertTriangle size={12} className={styles.highlightIcon} />
                            <span>{evt.highlight_reason}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Empty Filter Results State */}
                {filteredEvents.length === 0 && (
                  <div className={styles.noEventsFoundCard}>
                    <div className={styles.noEventsIconBox}>
                      <Filter size={24} color="var(--text-muted)" />
                    </div>
                    <span className={styles.noEventsTitle}>NO MATCHING FORENSIC EVENTS</span>
                    <p className={styles.noEventsDesc}>
                      No timeline events match the current combination of active filters.
                      {activeStageFilter !== 'ALL' && ` Stage: ${activeStageFilter}.`}
                      {suspiciousOnlyFilter && ` Suspicious only: Active.`}
                      {searchQuery && ` Query: "${searchQuery}".`}
                    </p>
                    <button
                      type="button"
                      className={styles.tacticalBtnSecondary}
                      onClick={handleResetFilters}
                    >
                      <RotateCcw size={13} />
                      <span>RESET ALL FILTERS</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ==================================================== */}
          {/* COLUMN 3: SELECTED EVENT DETAIL & TRACEABILITY       */}
          {/* ==================================================== */}
          <aside className={styles.detailPane}>
            {selectedEvent ? (
              <div className={styles.detailCard}>
                <div className={styles.detailHeader}>
                  <div className={styles.detailTitleGroup}>
                    <Activity size={16} color="var(--accent-cyan)" />
                    <span className={styles.detailHeading}>EVENT DETAIL</span>
                  </div>
                  <span className={styles.eventIdTag}>{selectedEvent.event_id}</span>
                </div>

                {/* Event Properties Grid */}
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>TIMESTAMP</span>
                    <span className={styles.detailValue}>{selectedEvent.timestamp || 'N/A'}</span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>HOST</span>
                    <span className={styles.detailValue}>{selectedEvent.host || 'srv-corp-lnx01'}</span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>PROCESS</span>
                    <span className={styles.detailValueCode}>{selectedEvent.process || 'system'}</span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>EVENT TYPE</span>
                    <span className={styles.detailValue}>{selectedEvent.event_type}</span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>SEVERITY</span>
                    <span
                      className={`${styles.sevBadge} ${getSeverityBadgeClass(selectedEvent.severity)}`}
                    >
                      {selectedEvent.severity}
                    </span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>ATTACK STAGE</span>
                    <span className={styles.detailValueStage}>{selectedEvent.attack_stage}</span>
                  </div>
                </div>

                {/* Suspicious Highlight Alert */}
                {selectedEvent.suspicious && selectedEvent.highlight_reason && (
                  <div className={styles.detailAlertBox}>
                    <div className={styles.alertHeader}>
                      <ShieldAlert size={14} color="var(--accent-rose)" />
                      <span>FLAGGED SUSPICIOUS ACTIVITY</span>
                    </div>
                    <p className={styles.alertReason}>{selectedEvent.highlight_reason}</p>
                  </div>
                )}

                {/* Evidence Traceability Section */}
                <div className={styles.traceabilitySection}>
                  <div className={styles.traceabilityTitle}>
                    <Lock size={14} color="var(--accent-cyan)" />
                    <span>EVIDENCE TRACEABILITY</span>
                  </div>

                  <div className={styles.traceFlow}>
                    <div className={styles.traceNode}>
                      <span className={styles.traceNodeLabel}>TIMELINE EVENT</span>
                      <span className={styles.traceNodeVal}>{selectedEvent.event_id}</span>
                    </div>
                    <ChevronRight size={14} className={styles.traceArrow} />
                    <div className={styles.traceNode}>
                      <span className={styles.traceNodeLabel}>NORMALIZED EVENT</span>
                      <span className={styles.traceNodeVal}>#{selectedEvent.original_event_index}</span>
                    </div>
                    <ChevronRight size={14} className={styles.traceArrow} />
                    <div className={styles.traceNode}>
                      <span className={styles.traceNodeLabel}>SOURCE EVIDENCE</span>
                      <span className={styles.traceNodeVal}>
                        {selectedEvent.source_line_start
                          ? `Line ${selectedEvent.source_line_start}`
                          : 'Source line reference unavailable'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Original Log Message (Safe Text View) */}
                <div className={styles.rawMessageSection}>
                  <div className={styles.rawHeader}>
                    <span className={styles.rawLabel}>ORIGINAL VERBATIM EVENT</span>
                    <button
                      type="button"
                      className={styles.copyBtn}
                      onClick={() => copyToClipboard(selectedEvent.raw_message)}
                      title="Copy raw log line"
                    >
                      {hasCopiedMessage ? (
                        <Check size={12} color="var(--accent-emerald)" />
                      ) : (
                        <Copy size={12} />
                      )}
                      <span>{hasCopiedMessage ? 'COPIED' : 'COPY'}</span>
                    </button>
                  </div>
                  {/* SAFE TEXT RENDERING: React renders inert text without HTML evaluation */}
                  <pre className={styles.rawPre}>{selectedEvent.raw_message}</pre>
                </div>
              </div>
            ) : (
              <div className={styles.detailEmpty}>
                <div className={styles.detailEmptyIconBox}>
                  <Filter size={24} color="var(--text-muted)" />
                </div>
                <span className={styles.detailEmptyTitle}>NO EVENT SELECTED</span>
                <p className={styles.detailEmptyText}>
                  {filteredEvents.length === 0
                    ? 'No events match the current filter criteria. Clear or adjust filters to view event details.'
                    : 'Select an event from the timeline stream to inspect forensic details.'}
                </p>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
};

