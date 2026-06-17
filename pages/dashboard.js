import { useState, useEffect } from 'react';
import Head from 'next/head';

// ═══════════════════════════════════════════
// DIG Dashboard v2.0 — FRI Analytics + Feedback
// ═══════════════════════════════════════════

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [fri, setFri] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [fbRes, friRes] = await Promise.all([
        fetch('/api/dig/feedback'),
        fetch('/api/dig/fri'),
      ]);
      const fbData = await fbRes.json();
      const friData = await friRes.json();
      setStats(fbData.stats);
      setFeedback(fbData.list);
      if (friData.success) setFri(friData.fri);
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
        <title>DIG — FRI Analytics Dashboard</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div style={S.page}>
        <div style={S.container}>
          {/* Header */}
          <div style={S.header}>
            <a href="/" style={S.backLink}>← Back to DIG</a>
            <h1 style={S.title}>System Dashboard</h1>
            <p style={S.subtitle}>FRI Analytics · Feedback Intelligence · Three Pillars</p>
          </div>

          {/* FRI Hero Card */}
          {fri && (
            <div style={{...S.friHero, borderColor: fri.color + '40'}}>
              <div style={S.friHeroLeft}>
                <div style={{fontSize: 48, lineHeight: 1}}>{fri.icon}</div>
              </div>
              <div style={S.friHeroCenter}>
                <div style={S.friHeroLabel}>FORECASTING RESILIENCE INDEX</div>
                <div style={{...S.friHeroScore, color: fri.color}}>{fri.score}<span style={S.friHeroMax}>/100</span></div>
                <div style={{...S.friHeroLevel, color: fri.color}}>{fri.level}</div>
                <div style={S.friHeroDesc}>{fri.description}</div>
              </div>
              <div style={S.friHeroRight}>
                <div style={S.friBarOuter}>
                  <div style={{...S.friBarInner, height: `${fri.score}%`, background: fri.color}} />
                </div>
              </div>
            </div>
          )}

          {/* FRI Breakdown */}
          {fri && (
            <div style={S.cardWide}>
              <div style={S.cardLabel}>FRI BREAKDOWN</div>
              <div style={S.breakdownGrid}>
                {[
                  { label: 'SATISFACTION', value: fri.breakdown?.satisfaction, weight: '35%', icon: '👍', color: '#22c55e' },
                  { label: 'TREND', value: fri.breakdown?.trend, weight: '25%', icon: '📈', color: '#3b82f6' },
                  { label: 'VOLUME', value: fri.breakdown?.volume, weight: '20%', icon: '📊', color: '#a78bfa' },
                  { label: 'CONSISTENCY', value: fri.breakdown?.consistency, weight: '20%', icon: '🔒', color: '#f59e0b' },
                ].map(f => (
                  <div key={f.label} style={S.breakdownItem}>
                    <div style={S.breakdownHeader}>
                      <span>{f.icon} {f.label}</span>
                      <span style={{fontSize: 9, color: '#52525b'}}>Weight: {f.weight}</span>
                    </div>
                    <div style={{...S.breakdownValue, color: f.color}}>{f.value ?? '—'}</div>
                    <div style={S.breakdownBarOuter}>
                      <div style={{...S.breakdownBarInner, width: `${f.value || 0}%`, background: f.color}} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                    <div style={S.alertText}>
                      High negative feedback rate in recent 20 interactions.
                      {fri && <span> Current FRI: <strong style={{color: fri.color}}>{fri.score}</strong> — system is adapting.</span>}
                    </div>
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

              {/* Feedback History */}
              {feedback && (
                <div style={S.cardWide}>
                  <div style={S.cardLabel}>FEEDBACK HISTORY ({feedback.total} total)</div>
                  {feedback.items.map((fb) => (
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
            <button style={S.refreshBtn} onClick={fetchData}>↻ Refresh All</button>
          </div>
        </div>
      </div>
    </>
  );
}

const S = {
  page: { minHeight:'100vh', background:'#09090b', fontFamily:"'Inter',-apple-system,sans-serif", color:'#e4e4e7' },
  loading: { display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontSize:14, color:'#71717a' },
  container: { maxWidth:840, margin:'0 auto', padding:'32px 20px' },
  header: { marginBottom:32 },
  backLink: { fontSize:12, color:'#3b82f6', textDecoration:'none', marginBottom:8, display:'inline-block' },
  title: { fontSize:28, fontWeight:700, color:'#fafafa', margin:'8px 0 4px 0' },
  subtitle: { fontSize:13, color:'#71717a', margin:0 },

  // FRI Hero
  friHero: { display:'flex', alignItems:'center', gap:24, background:'#111113', border:'1px solid', borderRadius:14, padding:'24px 28px', marginBottom:20 },
  friHeroLeft: { flexShrink:0 },
  friHeroCenter: { flex:1 },
  friHeroLabel: { fontSize:10, fontWeight:700, color:'#52525b', letterSpacing:'0.15em', marginBottom:4 },
  friHeroScore: { fontSize:48, fontWeight:800, lineHeight:1.1 },
  friHeroMax: { fontSize:20, fontWeight:400, color:'#3f3f46' },
  friHeroLevel: { fontSize:14, fontWeight:600, marginTop:2 },
  friHeroDesc: { fontSize:12, color:'#71717a', marginTop:4 },
  friHeroRight: { width:24, height:120, flexShrink:0 },
  friBarOuter: { width:24, height:'100%', background:'#1f1f23', borderRadius:12, overflow:'hidden', display:'flex', flexDirection:'column', justifyContent:'flex-end' },
  friBarInner: { width:'100%', borderRadius:12, transition:'height 0.5s ease', minHeight: 8 },

  // FRI Breakdown
  breakdownGrid: { display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginTop:12 },
  breakdownItem: { background:'#09090b', border:'1px solid #1f1f23', borderRadius:8, padding:'12px 14px' },
  breakdownHeader: { display:'flex', justifyContent:'space-between', fontSize:10, fontWeight:700, color:'#71717a', letterSpacing:'0.05em', marginBottom:6 },
  breakdownValue: { fontSize:24, fontWeight:700, marginBottom:6 },
  breakdownBarOuter: { height:4, background:'#1f1f23', borderRadius:2 },
  breakdownBarInner: { height:'100%', borderRadius:2, transition:'width 0.5s ease' },

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
