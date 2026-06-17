import { useState, useEffect } from 'react';
import Head from 'next/head';

// ═══════════════════════════════════════════
// DIG Dashboard v2.1 — Mobile-Responsive
// ═══════════════════════════════════════════

const MOBILE_BREAKPOINT = 768;

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${MOBILE_BREAKPOINT}px)`);
    setMobile(mq.matches);
    const handler = (e) => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return mobile;
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [fri, setFri] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div style={S.page}>
        <div style={S.container}>
          {/* Header */}
          <div style={S.header}>
            <a href="/" style={S.backLink}>← Back to DIG</a>
            <h1 style={S.title}>System Dashboard</h1>
            <p style={S.subtitle}>FRI Analytics · Feedback Intelligence</p>
          </div>

          {/* FRI Hero */}
          {fri && (
            <div style={{...S.friHero, flexDirection: isMobile ? 'column' : 'row', textAlign: isMobile ? 'center' : 'left', gap: isMobile ? 12 : 24}}>
              <div style={{fontSize: isMobile ? 36 : 48, lineHeight: 1}}>{fri.icon}</div>
              <div style={{...S.friHeroCenter, alignItems: isMobile ? 'center' : 'flex-start'}}>
                <div style={S.friHeroLabel}>FORECASTING RESILIENCE INDEX</div>
                <div style={{...S.friHeroScore, color: fri.color}}>
                  {fri.score}<span style={S.friHeroMax}>/100</span>
                </div>
                <div style={{...S.friHeroLevel, color: fri.color}}>{fri.level}</div>
                <div style={S.friHeroDesc}>{fri.description}</div>
              </div>
              {!isMobile && (
                <div style={S.friHeroRight}>
                  <div style={S.friBarOuter}>
                    <div style={{...S.friBarInner, height: `${fri.score}%`, background: fri.color}} />
                  </div>
                </div>
              )}
              {isMobile && (
                <div style={{width:'100%', height:8, background:'#1f1f23', borderRadius:4}}>
                  <div style={{width:`${fri.score}%`, height:'100%', background:fri.color, borderRadius:4, transition:'width 0.5s'}} />
                </div>
              )}
            </div>
          )}

          {/* FRI Breakdown */}
          {fri && (
            <div style={S.cardWide}>
              <div style={S.cardLabel}>FRI BREAKDOWN</div>
              <div style={{display:'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 8 : 12, marginTop:12}}>
                {[
                  { label: 'SATISFACTION', value: fri.breakdown?.satisfaction, weight: '35%', icon: '👍', color: '#22c55e' },
                  { label: 'TREND', value: fri.breakdown?.trend, weight: '25%', icon: '📈', color: '#3b82f6' },
                  { label: 'VOLUME', value: fri.breakdown?.volume, weight: '20%', icon: '📊', color: '#a78bfa' },
                  { label: 'CONSISTENCY', value: fri.breakdown?.consistency, weight: '20%', icon: '🔒', color: '#f59e0b' },
                ].map(f => (
                  <div key={f.label} style={S.breakdownItem}>
                    <div style={{...S.breakdownHeader, fontSize: isMobile ? 9 : 10}}>
                      <span>{f.icon} {f.label}</span>
                      <span style={{fontSize: 9, color: '#52525b'}}>W:{f.weight}</span>
                    </div>
                    <div style={{...S.breakdownValue, color: f.color, fontSize: isMobile ? 20 : 24}}>{f.value ?? '—'}</div>
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
              <div style={{display:'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 8 : 12, marginBottom:16}}>
                <div style={S.card}>
                  <div style={S.cardLabel}>TOTAL</div>
                  <div style={{...S.cardValue, fontSize: isMobile ? 22 : 28}}>{stats.total}</div>
                </div>
                <div style={{...S.card, borderLeft:'3px solid #22c55e'}}>
                  <div style={S.cardLabel}>UPVOTES</div>
                  <div style={{...S.cardValue, color:'#22c55e', fontSize: isMobile ? 22 : 28}}>{stats.ups}</div>
                </div>
                <div style={{...S.card, borderLeft:'3px solid #ef4444'}}>
                  <div style={S.cardLabel}>DOWNVOTES</div>
                  <div style={{...S.cardValue, color:'#ef4444', fontSize: isMobile ? 22 : 28}}>{stats.downs}</div>
                </div>
                <div style={{...S.card, borderLeft:'3px solid #3b82f6'}}>
                  <div style={S.cardLabel}>SATISFACTION</div>
                  <div style={{...S.cardValue, color:'#3b82f6', fontSize: isMobile ? 22 : 28}}>{stats.satisfactionRate}%</div>
                </div>
              </div>

              {/* Last 24h */}
              <div style={S.cardWide}>
                <div style={S.cardLabel}>LAST 24 HOURS</div>
                <div style={{display:'flex', gap: isMobile ? 12 : 24, marginTop:8, flexWrap:'wrap'}}>
                  <span style={{fontSize: isMobile ? 12 : 14, color:'#a1a1aa'}}>Total: <strong>{stats.last24h.total}</strong></span>
                  <span style={{fontSize: isMobile ? 12 : 14, color:'#22c55e'}}>Up: <strong>{stats.last24h.ups}</strong></span>
                  <span style={{fontSize: isMobile ? 12 : 14, color:'#ef4444'}}>Down: <strong>{stats.last24h.downs}</strong></span>
                </div>
              </div>

              {/* Negative Alert */}
              {stats.negativeAlert && (
                <div style={{...S.alert, flexDirection: isMobile ? 'column' : 'row', textAlign: isMobile ? 'center' : 'left'}}>
                  <span style={{fontSize: isMobile ? 20 : 24}}>🚨</span>
                  <div>
                    <div style={S.alertTitle}>NEGATIVE PATTERN DETECTED</div>
                    <div style={S.alertText}>
                      High negative feedback rate in recent 20 interactions.
                      {fri && <span> FRI: <strong style={{color: fri.color}}>{fri.score}</strong> — adapting.</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Negatives */}
              <div style={S.cardWide}>
                <div style={S.cardLabel}>RECENT NEGATIVE FEEDBACK</div>
                {stats.recentNegatives.length === 0 ? (
                  <div style={S.empty}>No negative feedback yet 🎉</div>
                ) : (
                  stats.recentNegatives.map((fb, i) => (
                    <div key={i} style={S.fbItem}>
                      <div style={{fontSize: isMobile ? 11 : 12, color:'#a1a1aa', marginBottom:4}}>Q: {fb.userMessage?.substring(0, isMobile ? 60 : 100)}</div>
                      <div style={{fontSize: isMobile ? 11 : 12, color:'#71717a', marginBottom:4}}>D: {fb.diagnosis?.substring(0, isMobile ? 60 : 100)}</div>
                      {fb.comment && <div style={{fontSize: 12, color:'#fbbf24', fontStyle:'italic', marginBottom:4}}>"{fb.comment}"</div>}
                      <div style={{fontSize:10, color:'#3f3f46'}}>{fb.timestamp}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Feedback History */}
              {feedback && (
                <div style={S.cardWide}>
                  <div style={S.cardLabel}>FEEDBACK HISTORY ({feedback.total})</div>
                  {feedback.items.map((fb) => (
                    <div key={fb.id} style={{...S.historyItem, flexDirection: isMobile ? 'row' : 'row'}}>
                      <span style={{fontSize:14}}>{fb.rating === 'up' ? '👍' : '👎'}</span>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{fontSize: isMobile ? 11 : 12, color:'#a1a1aa', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{fb.userMessage?.substring(0, isMobile ? 50 : 80)}</div>
                        <div style={{fontSize:10, color:'#3f3f46'}}>{fb.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <div style={{textAlign:'center', marginTop:16, paddingBottom:20}}>
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
  container: { maxWidth:840, margin:'0 auto', padding:'24px 16px' },
  header: { marginBottom:24 },
  backLink: { fontSize:12, color:'#3b82f6', textDecoration:'none', marginBottom:8, display:'inline-block' },
  title: { fontSize:24, fontWeight:700, color:'#fafafa', margin:'6px 0 2px 0' },
  subtitle: { fontSize:12, color:'#71717a', margin:0 },

  friHero: { display:'flex', alignItems:'center', background:'#111113', border:'1px solid', borderRadius:14, padding:'20px 24px', marginBottom:16 },
  friHeroCenter: { flex:1, display:'flex', flexDirection:'column' },
  friHeroLabel: { fontSize:10, fontWeight:700, color:'#52525b', letterSpacing:'0.15em', marginBottom:4 },
  friHeroScore: { fontSize:42, fontWeight:800, lineHeight:1.1 },
  friHeroMax: { fontSize:18, fontWeight:400, color:'#3f3f46' },
  friHeroLevel: { fontSize:13, fontWeight:600, marginTop:2 },
  friHeroDesc: { fontSize:12, color:'#71717a', marginTop:4 },
  friHeroRight: { width:24, height:100, flexShrink:0 },
  friBarOuter: { width:24, height:'100%', background:'#1f1f23', borderRadius:12, overflow:'hidden', display:'flex', flexDirection:'column', justifyContent:'flex-end' },
  friBarInner: { width:'100%', borderRadius:12, transition:'height 0.5s ease', minHeight: 8 },

  cardWide: { background:'#111113', border:'1px solid #1f1f23', borderRadius:10, padding:'14px 16px', marginBottom:12 },
  cardLabel: { fontSize:10, fontWeight:700, color:'#52525b', letterSpacing:'0.1em', marginBottom:6 },
  card: { background:'#111113', border:'1px solid #1f1f23', borderRadius:10, padding:'14px 16px', borderLeft:'3px solid #27272a' },
  cardValue: { fontSize:26, fontWeight:700, color:'#fafafa' },

  breakdownItem: { background:'#09090b', border:'1px solid #1f1f23', borderRadius:8, padding:'10px 12px' },
  breakdownHeader: { display:'flex', justifyContent:'space-between', fontSize:10, fontWeight:700, color:'#71717a', letterSpacing:'0.05em', marginBottom:4 },
  breakdownValue: { fontSize:22, fontWeight:700, marginBottom:4 },
  breakdownBarOuter: { height:4, background:'#1f1f23', borderRadius:2 },
  breakdownBarInner: { height:'100%', borderRadius:2, transition:'width 0.5s ease' },

  alert: { display:'flex', alignItems:'center', gap:12, background:'#1c1917', border:'1px solid #7f1d1d', borderRadius:10, padding:'12px 16px', marginBottom:12 },
  alertTitle: { fontSize:12, fontWeight:700, color:'#fca5a5', letterSpacing:'0.05em' },
  alertText: { fontSize:11, color:'#d6d3d1', marginTop:2 },

  empty: { fontSize:13, color:'#52525b', padding:'12px 0' },
  fbItem: { background:'#09090b', border:'1px solid #1f1f23', borderRadius:6, padding:'8px 12px', marginBottom:6 },

  historyItem: { display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid #1f1f23' },

  refreshBtn: { background:'#111113', border:'1px solid #27272a', borderRadius:8, padding:'8px 20px', fontSize:13, color:'#a1a1aa', cursor:'pointer', fontFamily:'inherit' },
};
