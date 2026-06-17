import { useState } from 'react';
import Head from 'next/head';

// ═══════════════════════════════════════════
// DIG Consultation Widget Component
// ═══════════════════════════════════════════

function DIGWidget() {
  const [input, setInput] = useState({
    topic: '',
    context: '',
    urgency: 'medium',
    depth: 'normal',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.topic.trim() || !input.context.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/dig/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Consultation failed');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const urgencyColors = {
    low: '#22c55e',
    medium: '#eab308',
    high: '#f97316',
    critical: '#ef4444',
  };

  return (
    <>
      <Head>
        <title>DIG Consultation Widget</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>⬡ DIG Consultation</h1>
          <p style={styles.subtitle}>Diagnosis-First Analysis Engine</p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>TOPIC *</label>
            <input
              type="text"
              placeholder="What's the problem? e.g., 'My VPS keeps crashing'"
              value={input.topic}
              onChange={(e) => setInput({ ...input, topic: e.target.value })}
              style={styles.input}
              maxLength={500}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>CONTEXT *</label>
            <textarea
              placeholder="Background info: What happened? When? What did you already try?"
              value={input.context}
              onChange={(e) => setInput({ ...input, context: e.target.value })}
              style={styles.textarea}
              rows={5}
              maxLength={5000}
            />
            <span style={styles.charCount}>{input.context.length}/5000</span>
          </div>

          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>URGENCY</label>
              <div style={styles.pillGroup}>
                {['low', 'medium', 'high', 'critical'].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setInput({ ...input, urgency: u })}
                    style={{
                      ...styles.pill,
                      ...(input.urgency === u ? styles.pillActive : {}),
                      borderColor: urgencyColors[u],
                      ...(input.urgency === u
                        ? { background: urgencyColors[u], color: '#fff' }
                        : {}),
                    }}
                  >
                    {u.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>DEPTH</label>
              <div style={styles.pillGroup}>
                {['surface', 'normal', 'deep'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setInput({ ...input, depth: d })}
                    style={{
                      ...styles.pill,
                      ...(input.depth === d ? styles.pillActive : {}),
                    }}
                  >
                    {d.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !input.topic.trim() || !input.context.trim()}
            style={{
              ...styles.button,
              ...(loading || !input.topic.trim() || !input.context.trim()
                ? styles.buttonDisabled
                : {}),
            }}
          >
            {loading ? '⟳ Analyzing...' : '▶ RUN CONSULTATION'}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div style={styles.error}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Results */}
        {result && result.result && (
          <div style={styles.results}>
            {/* Diagnosis */}
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <span style={styles.sectionIcon}>🔴</span>
                <span style={styles.sectionTitle}>DIAGNOSIS</span>
              </div>
              <div style={styles.diagnosisBox}>{result.result.diagnosis}</div>
            </div>

            {/* Analysis */}
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <span style={styles.sectionIcon}>🟡</span>
                <span style={styles.sectionTitle}>ANALYSIS</span>
              </div>
              <div style={styles.analysisBox}>
                {result.result.analysis.split('\n').map((line, i) => (
                  <p key={i} style={line ? styles.paragraph : styles.emptyLine}>
                    {line}
                  </p>
                ))}
              </div>
            </div>

            {/* Action Plan */}
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <span style={styles.sectionIcon}>🟢</span>
                <span style={styles.sectionTitle}>ACTION PLAN</span>
              </div>
              <div style={styles.planList}>
                {result.result.actionPlan.map((step, i) => (
                  <div key={i} style={styles.planItem}>
                    <span style={styles.planNumber}>{i + 1}</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Notes */}
            {result.result.riskNotes.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <span style={styles.sectionIcon}>⚠️</span>
                  <span style={styles.sectionTitle}>RISK NOTES</span>
                </div>
                <div style={styles.riskList}>
                  {result.result.riskNotes.map((risk, i) => (
                    <div key={i} style={styles.riskItem}>
                      {risk}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confidence + Meta */}
            <div style={styles.metaBar}>
              <div style={styles.confidence}>
                Confidence: <strong>{result.result.confidence}%</strong>
              </div>
              {result.meta && (
                <div style={styles.metaInfo}>
                  Model: {result.meta.model} | Tokens: {result.meta.tokens}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════
// Styles (inline for single-file simplicity)
// ═══════════════════════════════════════════

const styles = {
  container: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '24px 16px',
    fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
    color: '#e4e4e7',
    background: '#09090b',
    minHeight: '100vh',
  },
  header: {
    textAlign: 'center',
    marginBottom: 32,
    borderBottom: '1px solid #27272a',
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#fafafa',
    margin: 0,
  },
  subtitle: {
    fontSize: 13,
    color: '#71717a',
    marginTop: 4,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    marginBottom: 32,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: 700,
    color: '#a1a1aa',
    letterSpacing: '0.1em',
  },
  input: {
    background: '#18181b',
    border: '1px solid #27272a',
    borderRadius: 8,
    padding: '12px 14px',
    fontSize: 14,
    color: '#fafafa',
    outline: 'none',
    fontFamily: 'inherit',
  },
  textarea: {
    background: '#18181b',
    border: '1px solid #27272a',
    borderRadius: 8,
    padding: '12px 14px',
    fontSize: 14,
    color: '#fafafa',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  charCount: {
    fontSize: 11,
    color: '#52525b',
    textAlign: 'right',
  },
  row: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
  },
  pillGroup: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  pill: {
    padding: '6px 14px',
    borderRadius: 20,
    border: '1px solid #3f3f46',
    background: 'transparent',
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: '0.05em',
    fontFamily: 'inherit',
  },
  pillActive: {
    color: '#fff',
  },
  button: {
    padding: '14px 24px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '0.05em',
    fontFamily: 'inherit',
  },
  buttonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  error: {
    background: '#1c1917',
    border: '1px solid #7f1d1d',
    borderRadius: 8,
    padding: 14,
    marginBottom: 24,
    color: '#fca5a5',
    fontSize: 13,
  },
  results: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  section: {
    background: '#18181b',
    border: '1px solid #27272a',
    borderRadius: 10,
    padding: 18,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#a1a1aa',
    letterSpacing: '0.12em',
  },
  diagnosisBox: {
    fontSize: 16,
    fontWeight: 600,
    color: '#fafafa',
    lineHeight: 1.5,
    borderLeft: '3px solid #ef4444',
    paddingLeft: 14,
  },
  analysisBox: {
    fontSize: 13,
    color: '#d4d4d8',
    lineHeight: 1.7,
  },
  paragraph: {
    margin: '0 0 10px 0',
  },
  emptyLine: {
    margin: 0,
    height: 8,
  },
  planList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  planItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    fontSize: 13,
    color: '#d4d4d8',
  },
  planNumber: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    background: '#16a34a',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    flexShrink: 0,
  },
  riskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  riskItem: {
    fontSize: 13,
    color: '#fbbf24',
    paddingLeft: 20,
    position: 'relative',
  },
  metaBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderTop: '1px solid #27272a',
    fontSize: 11,
    color: '#52525b',
  },
  confidence: {
    fontSize: 12,
  },
  metaInfo: {
    fontSize: 11,
  },
};

export default DIGWidget;
