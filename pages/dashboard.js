import { useState, useEffect } from 'react';
import Head from 'next/head';

// DIG Feedback Analytics Dashboard — Pillar 3 visualization
// Route: /dashboard

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dig/feedback');
      const data = await res.json();
      setStats(data.stats);
      setFeedback(data.list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={S.page}>
        <Head><title>DIG — Analytics Dashboard</title></Head>
        <div style={S.loading}>Loading analytics...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>DIG — Feedback Analytics</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div style={S.page}>
        <div style={S.container}>
          {/* Header */}
          <div style={S.header}>
            <a href="/" style={S.backLink}>← Back to DIG</a>
            <h1 style={S.title}>Feedback Analytics</h1>
            <p style={S.subtitle}>Pillar 3 — Self-Correction Loop Dashboard</p>
          </div>

          {stats && (
            <>
              {/* Stat Cards */}
              <div style={S.cardGrid}>
                <div style={S.card}>
                  <div style={S.cardLabel}>TOTAL</div>
                  <div style={S.cardValue}>{stats.total}</div>
                </div>
                <div style={{...S.card, borderLeft:'3px solid #22c55e'}}>
                  <div style={S.cardLabel}>UPVOTES</div>
                  <div style={{...S.cardValue, color:'#22c55e'}}>{stats.ups}</div>
                </div>
                <div style={{...S.card, borderLeft:'3px solid #ef4444'}}>
                  <div style={S.cardLabel}>DOWNVOTES</div>
                  <div style={{...S.cardValue, color:'#ef4444'}}>{stats.downs}</div>
                </div>
                <div style={{...S.card, borderLeft:'3px solid #3b82f6'}}>
                  <div style={S.cardLabel}>SATISFACTION</div>
                  <div style={{...S.cardValue, color:'#3b82f6'}}>{stats.satisfactionRate}%</div>
                </div>
              </div>

              {/* Last 24h */}
              <div style={S.cardWide}>
                <div style={S.cardLabel}>LAST 24 HOURS</div>
                <div style={S.row}>
                  <span style={S.rowItem}>Total: <strong>{stats.last24h.total}</strong></span>
                  <span style={{...S.rowItem, color:'#22c55e'}}>Up: <strong>{stats.last24h.ups}</strong></span>
                  <span style={{...S.rowItem, color:'#ef4444'}}>Down: <strong>{stats.last24h.downs}</strong></span>
                </div>
              </div>

              {/* Negative Alert */}
              {stats.negativeAlert && (
                <div style={S.alert}>
                  <span style={S.alertIcon}>🚨</span>
                  <div>
                    <div style={S.alertTitle}>NEGATIVE PATTERN DETECTED</div>
                    <div style={S.alertText}>High negative feedback rate in recent 20 interactions. Model may be struggling in certain areas.</div>
                  </div>
                </div>
              )}

              {/* Feedback List */}
              <div style={S.cardWide}>
                <div style={S.cardLabel}>RECENT NEGATIVE FEEDBACK</div>
                {stats.recentNegatives.length === 0 ? (
                  <div style={S.empty}>No negative feedback yet 🎉</div>
                ) : (
                  stats.recentNegatives.map((fb, i) => (
                    <div key={i} style={S.fbItem}>
                      <div style={S.fbUserQ}>Q: {fb.userMessage?.substring(0, 100)}</div>
                      <div style={S.fbDiag}>D: {fb.diagnosis?.substring(0, 100)}</div>
                      {fb.comment && <div style={S.fbComment}>"{fb.comment}"</div>}
                      <div style={S.fbTime}>{fb.timestamp}</div>
                    </div>
                  ))
                )}
              </div>

              {/* All Feedback History */}
              {feedback && (
                <div style={S.cardWide}>
                  <div style={S.cardLabel}>FEEDBACK HISTORY ({feedback.total} total)</div>
                  {feedback.items.map((fb, i) => (
                    <div key={fb.id} style={S.historyItem}>
                      <span style={fb.rating === 'up' ? S.ratedUp : S.ratedDown}>
                        {fb.rating === 'up' ? '👍' : '👎'}
                      </span>
                      <div style={S.historyContent}>
                        <div style={S.historyQ}>{fb.userMessage?.substring(0, 80)}</div>
                        <div style={S.historyTime}>{fb.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <div style={S.refresh}>
            <button style={S.refreshBtn} onClick={fetchData}>↻ Refresh</button>
          </div>
        </div>
      </div>
    </>
  );
}

const S = {
  page: { minHeight:'100vh', background:'#09090b', fontFamily:"'Inter',-apple-system,sans-serif", color:'#e4e4e7' },
  loading: { display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontSize:14, color:'#71717a' },
  container: { maxWidth:800, margin:'0 auto', padding:'32px 20px' },
  header: { marginBottom:32 },
  backLink: { fontSize:12, color:'#3b82f6', textDecoration:'none', marginBottom:8, display:'inline-block' },
  title: { fontSize:28, fontWeight:700, color:'#fafafa', margin:'8px 0 4px 0' },
  subtitle: { fontSize:13, color:'#71717a', margin:0 },

  cardGrid: { display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:16 },
  card: { background:'#111113', border:'1px solid #1f1f23', borderRadius:10, padding:'16px 18px', borderLeft:'3px solid #27272a' },
  cardLabel: { fontSize:10, fontWeight:700, color:'#52525b', letterSpacing:'0.1em', marginBottom:6 },
  cardValue: { fontSize:28, fontWeight:700, color:'#fafafa' },
  cardWide: { background:'#111113', border:'1px solid #1f1f23', borderRadius:10, padding:'16px 18px', marginBottom:16 },
  row: { display:'flex', gap:24, marginTop:8 },
  rowItem: { fontSize:14, color:'#a1a1aa' },

  alert: { display:'flex', alignItems:'center', gap:12, background:'#1c1917', border:'1px solid #7f1d1d', borderRadius:10, padding:'14px 18px', marginBottom:16 },
  alertIcon: { fontSize:24 },
  alertTitle: { fontSize:13, fontWeight:700, color:'#fca5a5', letterSpacing:'0.05em' },
  alertText: { fontSize:12, color:'#d6d3d1', marginTop:2 },

  empty: { fontSize:13, color:'#52525b', padding:'12px 0' },
  fbItem: { background:'#09090b', border:'1px solid #1f1f23', borderRadius:6, padding:'10px 14px', marginBottom:8 },
  fbUserQ: { fontSize:12, color:'#a1a1aa', marginBottom:4 },
  fbDiag: { fontSize:12, color:'#71717a', marginBottom:4 },
  fbComment: { fontSize:12, color:'#fbbf24', fontStyle:'italic', marginBottom:4 },
  fbTime: { fontSize:10, color:'#3f3f46' },

  historyItem: { display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid #1f1f23' },
  ratedUp: { fontSize:16 },
  ratedDown: { fontSize:16 },
  historyContent: { flex:1 },
  historyQ: { fontSize:12, color:'#a1a1aa' },
  historyTime: { fontSize:10, color:'#3f3f46' },

  refresh: { textAlign:'center', marginTop:16 },
  refreshBtn: { background:'#111113', border:'1px solid #27272a', borderRadius:8, padding:'8px 20px', fontSize:13, color:'#a1a1aa', cursor:'pointer', fontFamily:'inherit' },
};
