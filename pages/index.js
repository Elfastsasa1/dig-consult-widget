import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';

// ═══════════════════════════════════════════
// DIG Chat Widget v2.1 — Mobile-Responsive
// ═══════════════════════════════════════════

const FOCUS_ICONS = { resilience: '🛡️', efficiency: '⚡', speed: '🚀', caution: '🔍', exploration: '🧭' };
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

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [urgency, setUrgency] = useState('medium');
  const [depth, setDepth] = useState('normal');
  const [showSettings, setShowSettings] = useState(false);
  const [fri, setFri] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const isMobile = useIsMobile();

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => { fetchFRI(); }, []);
  useEffect(() => { if (!isMobile) setSidebarOpen(false); }, [isMobile]);

  const fetchFRI = async () => {
    try {
      const res = await fetch('/api/dig/fri');
      const data = await res.json();
      if (data.success && data.fri) setFri(data.fri);
    } catch (e) {}
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setLoading(true);
    if (isMobile) setSidebarOpen(false);
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);

    try {
      const res = await fetch('/api/dig/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: userMsg, context: userMsg, urgency, depth }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        if (data.fri) setFri(data.fri);
        setMessages((prev) => [...prev, { role: 'assistant', content: data.result, meta: data.meta, fri: data.fri, feedback: null }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: null, error: data.error || 'Failed' }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: null, error: err.message }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleFeedback = async (msgIdx, rating) => {
    const msg = messages[msgIdx];
    if (!msg || msg.feedback === rating) return;
    setMessages(prev => prev.map((m, i) => i === msgIdx ? { ...m, feedback: rating } : m));
    try {
      await fetch('/api/dig/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageIndex: msgIdx, userMessage: messages[msgIdx - 1]?.content || '', diagnosis: msg.content?.diagnosis || '', rating }),
      });
      setTimeout(fetchFRI, 500);
    } catch (e) {}
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const P = isMobile ? MP : DP; // P = Responsive style set

  return (
    <>
      <Head>
        <title>DIG — AI Consultation</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div style={P.page}>
        {/* Mobile Sidebar Overlay */}
        {isMobile && sidebarOpen && <div style={P.overlay} onClick={() => setSidebarOpen(false)} />}

        {/* Sidebar */}
        <aside style={{...P.sidebar, ...(isMobile && !sidebarOpen ? { transform:'translateX(-100%)' } : {}), ...(isMobile && sidebarOpen ? { position:'fixed', zIndex:100 } : {}) }}>
          <div style={P.sidebarHeader}>
            <div style={P.logo}>⬡</div>
            <span style={P.logoText}>DIG</span>
            {isMobile && <span style={P.closeBtn} onClick={() => setSidebarOpen(false)}>✕</span>}
          </div>
          <div style={P.sidebarNew} onClick={() => { setMessages([]); if (isMobile) setSidebarOpen(false); }}>
            <span style={P.plusIcon}>+</span> New Chat
          </div>
          <div style={P.sidebarHistory}>
            {messages.length === 0 ? (
              <div style={P.sidebarEmpty}>No conversations yet</div>
            ) : (
              <div style={P.sidebarItem}>
                {messages.find(m => m.role === 'user')?.content?.substring(0, 32) || 'New chat'}...
              </div>
            )}
          </div>

          {/* FRI Sidebar */}
          {fri && (
            <div style={P.friSidebar}>
              <div style={P.friLabel}>SYSTEM HEALTH</div>
              <div style={{...P.friScoreSidebar, color: fri.color}}>{fri.score}</div>
              <div style={{...P.friLevelSidebar, color: fri.color}}>
                {fri.icon} {fri.level}
              </div>
              <div style={P.friBarOuter}>
                <div style={{...P.friBarInner, width: `${fri.score}%`, background: fri.color}} />
              </div>
            </div>
          )}

          <div style={P.sidebarFooter}>
            <div style={{...P.statusDot, background: fri ? fri.color : '#22c55e'}} />
            <span style={P.footerText}>DIG v2.1 · FRI-Modulated</span>
          </div>
        </aside>

        {/* Main */}
        <main style={P.main}>
          {/* Top Bar */}
          <header style={P.topbar}>
            <div style={P.topbarLeft}>
              {isMobile && (
                <button style={P.hamburger} onClick={() => setSidebarOpen(true)}>☰</button>
              )}
              {!isMobile && <span style={P.topbarTitle}>DIG Consultation</span>}
              {isMobile && <span style={P.topbarTitle}>DIG</span>}
              {fri && (
                <div style={{...P.friBadge, borderColor: fri.color + '60'}}>
                  <span style={{color: fri.color, fontSize: isMobile ? 10 : 11, fontWeight: 700}}>
                    {fri.icon} FRI: {fri.score}
                  </span>
                  {!isMobile && <span style={{color:'#71717a', fontSize: 10}}>{fri.level}</span>}
                </div>
              )}
            </div>
            <button style={P.settingsBtn} onClick={() => setShowSettings(!showSettings)}>
              ⚙
            </button>
          </header>

          {/* Settings */}
          {showSettings && (
            <div style={P.settingsPanel}>
              <div style={{...P.settingsRow, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center'}}>
                <span style={P.settingsLabel}>Urgency</span>
                <div style={P.pillGroup}>
                  {['low', 'medium', 'high', 'critical'].map(u => (
                    <button key={u} onClick={() => setUrgency(u)} style={{
                      ...P.pill, ...(urgency === u ? { background:'#3b82f6', color:'#fff', borderColor:'#3b82f6' } : {})
                    }}>{u}</button>
                  ))}
                </div>
              </div>
              <div style={{...P.settingsRow, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center'}}>
                <span style={P.settingsLabel}>Depth</span>
                <div style={P.pillGroup}>
                  {['surface', 'normal', 'deep'].map(d => (
                    <button key={d} onClick={() => setDepth(d)} style={{
                      ...P.pill, ...(depth === d ? { background:'#3b82f6', color:'#fff', borderColor:'#3b82f6' } : {})
                    }}>{d}</button>
                  ))}
                </div>
              </div>
              {fri && (
                <div style={{...P.settingsRow, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center'}}>
                  <span style={P.settingsLabel}>FRI</span>
                  <div style={{...P.friDetail, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 4 : 12}}>
                    <span>Satisfaction: {fri.breakdown?.satisfaction}%</span>
                    <span>Trend: {fri.breakdown?.trend}</span>
                    <span>Volume: {fri.breakdown?.volume}</span>
                    <span>Consistency: {fri.breakdown?.consistency}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          <div style={P.messages}>
            {messages.length === 0 && (
              <div style={P.welcome}>
                <div style={P.welcomeIcon}>⬡</div>
                <h2 style={P.welcomeTitle}>How can I help you today?</h2>
                <p style={P.welcomeSub}>Diagnosis-first analysis powered by three pillars and FRI.</p>

                {fri && (
                  <div style={{...P.friWelcomeCard, borderColor: fri.color + '40'}}>
                    <div style={P.friWelcomeRow}>
                      <span style={{fontSize: isMobile ? 20 : 24}}>{fri.icon}</span>
                      <div>
                        <div style={{...P.friWelcomeScore, color: fri.color}}>FRI: {fri.score}/100</div>
                        <div style={P.friWelcomeDesc}>{fri.description}</div>
                      </div>
                    </div>
                    {fri.stats?.totalInteractions > 0 && (
                      <div style={P.friWelcomeStats}>
                        {fri.stats.totalInteractions} interactions · {fri.stats.satisfactionRate}% satisfaction
                      </div>
                    )}
                  </div>
                )}

                <div style={P.suggestions}>
                  {['My VPS keeps crashing at night', 'How to secure my crypto wallet?', 'My trading bot has false signals', 'Analyze this project architecture'].map(s => (
                    <button key={s} style={P.suggestBtn} onClick={() => { setInput(s); inputRef.current?.focus(); }}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === 'user' ? (
                  <div style={P.msgRow}>
                    {!isMobile && <div style={P.avatarUser}>You</div>}
                    <div style={P.bubbleUser}>{msg.content}</div>
                  </div>
                ) : (
                  <div style={P.msgRow}>
                    {!isMobile && <div style={P.avatarBot}>DIG</div>}
                    <div style={P.msgCol}>
                      {msg.error ? (
                        <div style={P.bubbleBot}><span style={{color:'#ef4444'}}>{msg.error}</span></div>
                      ) : msg.content ? (
                        <div style={P.bubbleBot}>
                          {/* Meta Status + FRI */}
                          {msg.content.metaStatus && (
                            <div style={P.metaBanner}>
                              <div style={P.metaIcon}>{FOCUS_ICONS[msg.content.metaStatus.focus] || '🧠'}</div>
                              <div style={P.metaTexts}>
                                <span style={P.metaFocus}>FOCUS: {msg.content.metaStatus.focus?.toUpperCase()}</span>
                                <span style={P.metaRationale}>{msg.content.metaStatus.rationale}</span>
                              </div>
                              {msg.content.metaStatus.friScore !== undefined && (
                                <div style={{...P.friMini, color: msg.fri?.color || '#71717a'}}>
                                  {msg.fri?.icon || '⚪'} {msg.content.metaStatus.friScore}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Diagnosis */}
                          <div style={P.section}>
                            <div style={P.sectionLabel}>DIAGNOSIS</div>
                            <div style={P.diagnosis}>{msg.content.diagnosis}</div>
                          </div>

                          {/* Analysis */}
                          <div style={P.section}>
                            <div style={P.sectionLabel}>ANALYSIS</div>
                            <div style={P.analysis}>{msg.content.analysis}</div>
                          </div>

                          {/* Cross-Links */}
                          {msg.content.crossLinks?.length > 0 && (
                            <div style={P.section}>
                              <div style={P.sectionLabel}>🔗 CROSS-LINKS</div>
                              <div style={P.crossLinks}>
                                {msg.content.crossLinks.map((cl, j) => (
                                  <div key={j} style={P.crossLinkCard}>
                                    <div style={P.clArea}>{cl.area}</div>
                                    <div style={P.clWhy}>{cl.why}</div>
                                    <div style={P.clAction}>→ {cl.action}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Plan */}
                          <div style={P.section}>
                            <div style={P.sectionLabel}>ACTION PLAN</div>
                            <div style={P.planList}>
                              {msg.content.actionPlan.map((step, j) => (
                                <div key={j} style={{
                                  ...P.planItem,
                                  ...(step.startsWith('[FRI]') ? P.friVerifyStep : {})
                                }}>
                                  <div style={P.planNum}>{j + 1}</div>
                                  <span>{step.replace(/^\[FRI\]\s*/, '')}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Risk */}
                          {msg.content.riskNotes?.length > 0 && (
                            <div style={P.section}>
                              <div style={P.sectionLabel}>⚠️ RISKS</div>
                              {msg.content.riskNotes.map((r, j) => (
                                <div key={j} style={P.riskItem}>{r}</div>
                              ))}
                            </div>
                          )}

                          {/* Meta footer */}
                          <div style={P.resultFooter}>
                            <span>Confidence: <strong style={{color: msg.content.confidence > 75 ? '#22c55e' : msg.content.confidence > 50 ? '#eab308' : '#ef4444'}}>{msg.content.confidence}%</strong></span>
                            <div style={P.footerRight}>
                              {msg.fri && <span style={{color: msg.fri.color}}>FRI: {msg.fri.score}</span>}
                              {msg.meta && <span>{msg.meta.model?.split('/')[1] || msg.meta.model} · {msg.meta.tokens}t</span>}
                            </div>
                          </div>

                          {/* Feedback */}
                          <div style={P.feedbackRow}>
                            <span style={P.feedbackLabel}>Helpful?</span>
                            <button onClick={() => handleFeedback(i, 'up')} style={{ ...P.thumbBtn, ...(msg.feedback === 'up' ? P.thumbActiveUp : {}) }}>👍</button>
                            <button onClick={() => handleFeedback(i, 'down')} style={{ ...P.thumbBtn, ...(msg.feedback === 'down' ? P.thumbActiveDown : {}) }}>👎</button>
                            {msg.feedback && <span style={P.feedbackThanks}>Thanks!</span>}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={P.msgRow}>
                {!isMobile && <div style={P.avatarBot}>DIG</div>}
                <div style={P.bubbleBot}>
                  <div style={P.typing}>
                    <span style={P.dot} /><span style={{...P.dot, animationDelay:'0.2s'}} /><span style={{...P.dot, animationDelay:'0.4s'}} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={P.inputArea}>
            <form onSubmit={handleSubmit} style={P.inputForm}>
              <div style={P.inputRow}>
                <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown} placeholder="Describe your problem..."
                  style={P.inputField} rows={1} />
                <button type="submit" disabled={!input.trim() || loading}
                  style={{ ...P.sendBtn, ...((!input.trim() || loading) ? { opacity: 0.3, cursor: 'not-allowed' } : {}) }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
              {!isMobile && <p style={P.disclaimer}>DIG v2.1 · FRI-Modulated Engine · Powered by OpenRouter</p>}
            </form>
          </div>
        </main>
      </div>

      <style>{`
        @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
        *{box-sizing:border-box}
        html,body,#__next{margin:0;padding:0;height:100%;overflow:hidden;-webkit-tap-highlight-color:transparent}
        html{height:100%;height:-webkit-fill-available}
        body{min-height:100vh;min-height:-webkit-fill-available}
        textarea{resize:none;margin:0;padding:0;border:none;outline:none;background:transparent;font-family:inherit;color:#fafafa;font-size:16px;-webkit-appearance:none;appearance:none}
        textarea:focus{outline:none;border:none}
        input,textarea{-webkit-border-radius:0;border-radius:0}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#3f3f46;border-radius:3px}
        button{touch-action:manipulation;-webkit-appearance:none;appearance:none}
        @supports (padding-bottom:env(safe-area-inset-bottom)){
          .dig-input-safe{padding-bottom:calc(12px + env(safe-area-inset-bottom))}
        }
      `}</style>
    </>
  );
}


// ═══════════════════════════════════════════
// DESKTOP STYLES (>=768px)
// ═══════════════════════════════════════════
const DP = {
  page: { display:'flex', height:'100vh', fontFamily:"'Inter',-apple-system,sans-serif", background:'#09090b', color:'#e4e4e7', overflow:'hidden' },
  overlay: { display:'none' },

  // Sidebar
  sidebar: { width:260, background:'#111113', borderRight:'1px solid #1f1f23', display:'flex', flexDirection:'column', flexShrink:0, transition:'transform 0.3s ease' },
  sidebarHeader: { display:'flex', alignItems:'center', gap:10, padding:'16px 18px', borderBottom:'1px solid #1f1f23' },
  logo: { fontSize:22, fontWeight:700, color:'#3b82f6' },
  logoText: { fontSize:18, fontWeight:700, color:'#fafafa', letterSpacing:'-0.02em' },
  closeBtn: { display:'none' },
  sidebarNew: { display:'flex', alignItems:'center', gap:10, padding:'12px 18px', margin:'12px 10px', background:'#1a1a1f', border:'1px solid #27272a', borderRadius:8, fontSize:13, color:'#d4d4d8', cursor:'pointer' },
  plusIcon: { fontSize:16, color:'#71717a' },
  sidebarHistory: { flex:1, padding:'8px 10px', overflowY:'auto' },
  sidebarEmpty: { fontSize:12, color:'#3f3f46', textAlign:'center', padding:'20px 0' },
  sidebarItem: { fontSize:13, color:'#d4d4d8', padding:'10px 12px', background:'#1a1a1f', borderRadius:6, borderLeft:'2px solid #3b82f6', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  friSidebar: { padding:'14px 18px', borderTop:'1px solid #1f1f23', borderBottom:'1px solid #1f1f23' },
  friLabel: { fontSize:9, fontWeight:700, color:'#52525b', letterSpacing:'0.15em', marginBottom:6 },
  friScoreSidebar: { fontSize:32, fontWeight:700, lineHeight:1 },
  friLevelSidebar: { fontSize:11, fontWeight:600, marginTop:2 },
  friBarOuter: { width:'100%', height:4, background:'#1f1f23', borderRadius:2, marginTop:8 },
  friBarInner: { height:'100%', borderRadius:2, transition:'width 0.5s ease' },
  sidebarFooter: { padding:'14px 18px', borderTop:'1px solid #1f1f23', display:'flex', alignItems:'center', gap:8 },
  statusDot: { width:8, height:8, borderRadius:'50%' },
  footerText: { fontSize:11, color:'#52525b' },

  // Main
  main: { flex:1, display:'flex', flexDirection:'column', minWidth:0 },
  topbar: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 24px', borderBottom:'1px solid #1f1f23', flexShrink:0 },
  topbarLeft: { display:'flex', alignItems:'center', gap:12 },
  hamburger: { display:'none' },
  topbarTitle: { fontSize:14, fontWeight:600, color:'#fafafa' },
  friBadge: { display:'flex', flexDirection:'column', alignItems:'center', border:'1px solid', borderRadius:8, padding:'4px 10px', lineHeight:1.2 },
  settingsBtn: { background:'transparent', border:'1px solid #27272a', borderRadius:6, padding:'6px 12px', fontSize:12, color:'#a1a1aa', cursor:'pointer', fontFamily:'inherit' },

  // Settings
  settingsPanel: { padding:'14px 24px', background:'#111113', borderBottom:'1px solid #1f1f23', display:'flex', gap:24, flexWrap:'wrap', flexShrink:0 },
  settingsRow: { display:'flex', alignItems:'center', gap:10 },
  settingsLabel: { fontSize:12, color:'#71717a', fontWeight:500, minWidth:55 },
  pillGroup: { display:'flex', gap:6 },
  pill: { padding:'4px 12px', borderRadius:16, border:'1px solid #27272a', background:'transparent', color:'#71717a', fontSize:11, fontWeight:500, cursor:'pointer', fontFamily:'inherit', textTransform:'capitalize' },
  friDetail: { display:'flex', gap:12, fontSize:11, color:'#71717a' },

  messages: { flex:1, overflowY:'auto', padding:'0 0 20px 0' },

  // Welcome
  welcome: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', padding:'40px 20px', textAlign:'center' },
  welcomeIcon: { fontSize:40, color:'#3b82f6', marginBottom:16 },
  welcomeTitle: { fontSize:24, fontWeight:700, color:'#fafafa', margin:'0 0 8px 0' },
  welcomeSub: { fontSize:14, color:'#71717a', margin:'0 0 20px 0' },
  friWelcomeCard: { background:'#111113', border:'1px solid', borderRadius:12, padding:'16px 20px', marginBottom:24, width:'100%', maxWidth:420 },
  friWelcomeRow: { display:'flex', alignItems:'center', gap:12 },
  friWelcomeScore: { fontSize:18, fontWeight:700 },
  friWelcomeDesc: { fontSize:12, color:'#71717a' },
  friWelcomeStats: { fontSize:11, color:'#52525b', marginTop:8, paddingTop:8, borderTop:'1px solid #1f1f23' },
  suggestions: { display:'flex', flexDirection:'column', gap:8, maxWidth:420, width:'100%' },
  suggestBtn: { background:'#111113', border:'1px solid #27272a', borderRadius:10, padding:'12px 16px', fontSize:13, color:'#a1a1aa', textAlign:'left', cursor:'pointer', fontFamily:'inherit' },

  msgRow: { display:'flex', padding:'8px 24px', gap:12, alignItems:'flex-start' },
  msgCol: { flex:1, minWidth:0 },
  avatarUser: { width:32, height:32, borderRadius:'50%', background:'#3b82f6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 },
  avatarBot: { width:32, height:32, borderRadius:'50%', background:'#1a1a1f', border:'1px solid #27272a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#a1a1aa', flexShrink:0 },
  bubbleUser: { background:'#2563eb', borderRadius:'18px 18px 4px 18px', padding:'10px 16px', fontSize:14, lineHeight:1.6, color:'#fff', maxWidth:'70%', wordBreak:'break-word' },
  bubbleBot: { background:'#141416', border:'1px solid #1f1f23', borderRadius:'18px 18px 18px 4px', padding:'14px 18px', fontSize:14, lineHeight:1.7, color:'#d4d4d8', maxWidth:'80%', wordBreak:'break-word' },

  metaBanner: { display:'flex', alignItems:'center', gap:10, background:'#111113', border:'1px solid #1f1f23', borderRadius:8, padding:'10px 14px', marginBottom:14 },
  metaIcon: { fontSize:18, flexShrink:0 },
  metaTexts: { display:'flex', flexDirection:'column', gap:2, flex:1 },
  metaFocus: { fontSize:10, fontWeight:700, color:'#3b82f6', letterSpacing:'0.1em' },
  metaRationale: { fontSize:11, color:'#71717a', lineHeight:1.4 },
  friMini: { fontSize:12, fontWeight:700, flexShrink:0, borderLeft:'1px solid #1f1f23', paddingLeft:10, textAlign:'center', lineHeight:1.2 },

  section: { marginBottom:14 },
  sectionLabel: { fontSize:11, fontWeight:700, color:'#71717a', letterSpacing:'0.1em', marginBottom:6 },
  diagnosis: { fontSize:15, fontWeight:600, color:'#fafafa', lineHeight:1.5, borderLeft:'3px solid #ef4444', paddingLeft:12 },
  analysis: { fontSize:13, lineHeight:1.7, color:'#d4d4d8' },

  crossLinks: { display:'flex', flexDirection:'column', gap:8 },
  crossLinkCard: { background:'#111113', border:'1px solid #1f1f23', borderRadius:8, padding:'10px 14px' },
  clArea: { fontSize:12, fontWeight:600, color:'#3b82f6', marginBottom:3 },
  clWhy: { fontSize:12, color:'#71717a', marginBottom:3 },
  clAction: { fontSize:12, color:'#a1a1aa' },

  planList: { display:'flex', flexDirection:'column', gap:8 },
  planItem: { display:'flex', alignItems:'flex-start', gap:10, fontSize:13, color:'#d4d4d8' },
  friVerifyStep: { background:'#7f1d1d15', border:'1px solid #ef444430', borderRadius:6, padding:'6px 8px' },
  planNum: { width:22, height:22, borderRadius:11, background:'#16a34a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 },

  riskItem: { fontSize:13, color:'#fbbf24', marginBottom:4, paddingLeft:4 },

  resultFooter: { display:'flex', justifyContent:'space-between', borderTop:'1px solid #1f1f23', marginTop:12, paddingTop:8, fontSize:11, color:'#3f3f46' },
  footerRight: { display:'flex', gap:12 },

  feedbackRow: { display:'flex', alignItems:'center', gap:8, marginTop:10, paddingTop:10, borderTop:'1px solid #1f1f23' },
  feedbackLabel: { fontSize:12, color:'#52525b', marginRight:4 },
  thumbBtn: { background:'transparent', border:'1px solid #27272a', borderRadius:6, padding:'4px 10px', fontSize:16, cursor:'pointer', transition:'all 0.15s' },
  thumbActiveUp: { background:'#166534', borderColor:'#22c55e' },
  thumbActiveDown: { background:'#7f1d1d', borderColor:'#ef4444' },
  feedbackThanks: { fontSize:11, color:'#22c55e', marginLeft:4 },

  typing: { display:'flex', gap:4, padding:'4px 0' },
  dot: { width:7, height:7, borderRadius:'50%', background:'#52525b', animation:'bounce 1.2s infinite' },

  inputArea: { padding:'0 24px 16px', flexShrink:0 },
  inputForm: { maxWidth:768, margin:'0 auto' },
  inputRow: { display:'flex', alignItems:'flex-end', background:'#111113', border:'1px solid #27272a', borderRadius:14, padding:'6px 6px 6px 16px' },
  inputField: { flex:1, background:'transparent', border:'none', outline:'none', color:'#fafafa', fontSize:14, fontFamily:'inherit', padding:'8px 0', lineHeight:1.5, maxHeight:120 },
  sendBtn: { width:36, height:36, borderRadius:10, background:'#3b82f6', border:'none', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 },
  disclaimer: { fontSize:11, color:'#3f3f46', textAlign:'center', margin:'8px 0 0 0' },
};


// ═══════════════════════════════════════════
// MOBILE STYLES (<768px)
// ═══════════════════════════════════════════
const MP = {
  ...DP,
  page: { ...DP.page, overflow:'hidden' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:99, WebkitTapHighlightColor:'transparent' },

  // Sidebar: slide-in overlay on mobile
  sidebar: { ...DP.sidebar, width:280, position:'fixed', top:0, left:0, bottom:0, zIndex:100, transform:'translateX(-100%)', transition:'transform 0.25s ease' },
  sidebarHeader: { ...DP.sidebarHeader, padding:'14px 16px' },
  closeBtn: { display:'block', marginLeft:'auto', fontSize:18, color:'#71717a', cursor:'pointer', padding:'4px 8px' },
  sidebarNew: { ...DP.sidebarNew, margin:'10px 12px', padding:'10px 14px' },

  // Topbar
  topbar: { ...DP.topbar, padding:'10px 14px' },
  hamburger: { display:'block', background:'transparent', border:'1px solid #27272a', borderRadius:6, padding:'6px 10px', fontSize:18, color:'#a1a1aa', cursor:'pointer', lineHeight:1 },
  topbarTitle: { fontSize:14, fontWeight:600, color:'#fafafa' },
  friBadge: { ...DP.friBadge, padding:'3px 8px' },

  settingsBtn: { ...DP.settingsBtn, padding:'6px 10px', fontSize:11 },
  settingsPanel: { padding:'12px 14px', background:'#111113', borderBottom:'1px solid #1f1f23', display:'flex', flexDirection:'column', gap:12, flexShrink:0 },
  pillGroup: { display:'flex', gap:5, flexWrap:'wrap' },
  pill: { padding:'4px 10px', fontSize:10 },

  messages: { ...DP.messages, padding:'0 0 12px 0' },

  // Welcome
  welcome: { ...DP.welcome, padding:'24px 16px' },
  welcomeIcon: { fontSize:32, color:'#3b82f6', marginBottom:12 },
  welcomeTitle: { fontSize:20, fontWeight:700, color:'#fafafa', margin:'0 0 6px 0' },
  welcomeSub: { fontSize:13, color:'#71717a', margin:'0 0 16px 0' },
  friWelcomeCard: { ...DP.friWelcomeCard, padding:'12px 16px', marginBottom:16, maxWidth:'100%' },
  friWelcomeScore: { fontSize:16, fontWeight:700 },
  suggestions: { ...DP.suggestions, maxWidth:'100%' },
  suggestBtn: { ...DP.suggestBtn, padding:'10px 14px', fontSize:12 },

  // Messages
  msgRow: { padding:'6px 12px', gap:8 },
  bubbleUser: { ...DP.bubbleUser, fontSize:13, padding:'8px 12px', maxWidth:'85%', borderRadius:'14px 14px 4px 14px' },
  bubbleBot: { ...DP.bubbleBot, fontSize:13, padding:'10px 12px', maxWidth:'95%', borderRadius:'14px 14px 14px 4px' },

  metaBanner: { flexDirection:'row', flexWrap:'wrap', gap:8, padding:'8px 10px', marginBottom:10 },
  metaIcon: { fontSize:16 },
  metaFocus: { fontSize:9 },
  metaRationale: { fontSize:10 },
  friMini: { borderLeft:'none', paddingLeft:0, borderLeft:'1px solid #1f1f23', paddingLeft:8 },

  section: { marginBottom:12 },
  sectionLabel: { fontSize:10, marginBottom:4 },
  diagnosis: { fontSize:14, paddingLeft:10 },
  analysis: { fontSize:12, lineHeight:1.6 },

  crossLinkCard: { padding:'8px 10px' },
  clArea: { fontSize:11 },
  clWhy: { fontSize:11 },
  clAction: { fontSize:11 },

  planItem: { fontSize:12, gap:8 },
  planNum: { width:20, height:20, borderRadius:10, fontSize:10 },
  riskItem: { fontSize:12 },

  resultFooter: { flexDirection:'column', gap:4, fontSize:10 },
  footerRight: { gap:8 },

  feedbackRow: { ...DP.feedbackRow, flexWrap:'wrap', gap:6 },
  feedbackLabel: { fontSize:11 },

  // Input — critical mobile fixes
  inputArea: { padding:'8px 12px', paddingBottom:'max(8px, env(safe-area-inset-bottom))', flexShrink:0, background:'#09090b', borderTop:'1px solid #1f1f23', position:'relative', zIndex:10 },
  inputForm: { maxWidth:'100%', margin:'0 auto' },
  inputRow: { display:'flex', alignItems:'flex-end', background:'#111113', border:'1px solid #27272a', borderRadius:14, padding:'6px 6px 6px 14px', minHeight:44 },
  inputField: { flex:1, background:'transparent', border:'none', outline:'none', color:'#fafafa', fontSize:16, fontFamily:'inherit', padding:'8px 0', lineHeight:1.5, maxHeight:120, WebkitAppearance:'none', appearance:'none', WebkitTapHighlightColor:'transparent', wordBreak:'break-word', overflowWrap:'break-word' },
  sendBtn: { width:36, height:36, borderRadius:10, background:'#3b82f6', border:'none', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, WebkitTapHighlightColor:'transparent' },
};
