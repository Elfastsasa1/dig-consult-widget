import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';

// ═══════════════════════════════════════════
// DIG Chat Widget v2.0 — FRI-Modulated Edition
// Pillar 1: Meta-Cognitive Status Banner
// Pillar 2: Cross-Linker in responses
// Pillar 3: Feedback Loop (Thumbs Up/Down)
// NEW: FRI Gauge — System Health Indicator
// ═══════════════════════════════════════════

const FOCUS_ICONS = { resilience: '🛡️', efficiency: '⚡', speed: '🚀', caution: '🔍', exploration: '🧭' };

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [urgency, setUrgency] = useState('medium');
  const [depth, setDepth] = useState('normal');
  const [showSettings, setShowSettings] = useState(false);
  const [fri, setFri] = useState(null);
  const [friHistory, setFriHistory] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Fetch initial FRI
  useEffect(() => {
    fetchFRI();
  }, []);

  const fetchFRI = async () => {
    try {
      const res = await fetch('/api/dig/fri');
      const data = await res.json();
      if (data.success && data.fri) {
        setFri(data.fri);
        setFriHistory(prev => [...prev.slice(-20), { score: data.fri.score, time: Date.now() }]);
      }
    } catch (e) { /* silent */ }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);

    try {
      const res = await fetch('/api/dig/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: userMsg, context: userMsg, urgency, depth }),
      });
      const data = await res.json();

      if (data.success && data.result) {
        // Update FRI from response
        if (data.fri) {
          setFri(data.fri);
          setFriHistory(prev => [...prev.slice(-20), { score: data.fri.score, time: Date.now() }]);
        }
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: data.result,
          meta: data.meta,
          fri: data.fri,
          feedback: null,
        }]);
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
        body: JSON.stringify({
          messageIndex: msgIdx,
          userMessage: messages[msgIdx - 1]?.content || '',
          diagnosis: msg.content?.diagnosis || '',
          rating,
        }),
      });
      // Refresh FRI after feedback
      setTimeout(fetchFRI, 500);
    } catch (e) { /* feedback failed silently */ }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  return (
    <>
      <Head>
        <title>DIG — AI Consultation</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div style={S.page}>
        {/* Sidebar */}
        <aside style={S.sidebar}>
          <div style={S.sidebarHeader}>
            <div style={S.logo}>⬡</div>
            <span style={S.logoText}>DIG</span>
          </div>
          <div style={S.sidebarNew} onClick={() => { setMessages([]); }}>
            <span style={S.plusIcon}>+</span> New Chat
          </div>
          <div style={S.sidebarHistory}>
            {messages.length === 0 ? (
              <div style={S.sidebarEmpty}>No conversations yet</div>
            ) : (
              <div style={S.sidebarItem}>
                {messages.find(m => m.role === 'user')?.content?.substring(0, 32) || 'New chat'}...
              </div>
            )}
          </div>

          {/* FRI Sidebar Indicator */}
          {fri && (
            <div style={S.friSidebar}>
              <div style={S.friLabel}>SYSTEM HEALTH</div>
              <div style={{...S.friScoreSidebar, color: fri.color}}>{fri.score}</div>
              <div style={{...S.friLevelSidebar, color: fri.color}}>
                {fri.icon} {fri.level}
              </div>
              <div style={S.friBarOuter}>
                <div style={{...S.friBarInner, width: `${fri.score}%`, background: fri.color}} />
              </div>
            </div>
          )}

          <div style={S.sidebarFooter}>
            <div style={{...S.statusDot, background: fri ? fri.color : '#22c55e'}} />
            <span style={S.footerText}>DIG v2.0 · FRI-Modulated</span>
          </div>
        </aside>

        {/* Main */}
        <main style={S.main}>
          {/* Top Bar with FRI */}
          <header style={S.topbar}>
            <div style={S.topbarLeft}>
              <span style={S.topbarTitle}>DIG Consultation</span>
              {fri && (
                <div style={{...S.friBadge, borderColor: fri.color + '60'}}>
                  <span style={{color: fri.color, fontSize: 11, fontWeight: 700}}>
                    {fri.icon} FRI: {fri.score}
                  </span>
                  <span style={{color: '#71717a', fontSize: 10}}>
                    {fri.level}
                  </span>
                </div>
              )}
            </div>
            <button style={S.settingsBtn} onClick={() => setShowSettings(!showSettings)}>
              ⚙ Settings
            </button>
          </header>

          {/* Settings Panel */}
          {showSettings && (
            <div style={S.settingsPanel}>
              <div style={S.settingsRow}>
                <span style={S.settingsLabel}>Urgency</span>
                <div style={S.pillGroup}>
                  {['low', 'medium', 'high', 'critical'].map(u => (
                    <button key={u} onClick={() => setUrgency(u)} style={{
                      ...S.pill, ...(urgency === u ? { background: '#3b82f6', color: '#fff', borderColor: '#3b82f6' } : {})
                    }}>{u}</button>
                  ))}
                </div>
              </div>
              <div style={S.settingsRow}>
                <span style={S.settingsLabel}>Depth</span>
                <div style={S.pillGroup}>
                  {['surface', 'normal', 'deep'].map(d => (
                    <button key={d} onClick={() => setDepth(d)} style={{
                      ...S.pill, ...(depth === d ? { background: '#3b82f6', color: '#fff', borderColor: '#3b82f6' } : {})
                    }}>{d}</button>
                  ))}
                </div>
              </div>
              {fri && (
                <div style={S.settingsRow}>
                  <span style={S.settingsLabel}>FRI Detail</span>
                  <div style={S.friDetail}>
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
          <div style={S.messages}>
            {messages.length === 0 && (
              <div style={S.welcome}>
                <div style={S.welcomeIcon}>⬡</div>
                <h2 style={S.welcomeTitle}>How can I help you today?</h2>
                <p style={S.welcomeSub}>Diagnosis-first analysis powered by three pillars of intelligence and the FRI resilience system.</p>

                {/* FRI Status Card */}
                {fri && (
                  <div style={{...S.friWelcomeCard, borderColor: fri.color + '40'}}>
                    <div style={S.friWelcomeRow}>
                      <span style={{fontSize: 24}}>{fri.icon}</span>
                      <div>
                        <div style={{...S.friWelcomeScore, color: fri.color}}>FRI: {fri.score}/100</div>
                        <div style={S.friWelcomeDesc}>{fri.description}</div>
                      </div>
                    </div>
                    {fri.stats?.totalInteractions > 0 && (
                      <div style={S.friWelcomeStats}>
                        {fri.stats.totalInteractions} interactions · {fri.stats.satisfactionRate}% satisfaction
                      </div>
                    )}
                  </div>
                )}

                <div style={S.suggestions}>
                  {['My VPS keeps crashing at night', 'How to secure my crypto wallet?', 'My trading bot has too many false signals', 'Analyze this project architecture'].map(s => (
                    <button key={s} style={S.suggestBtn} onClick={() => { setInput(s); inputRef.current?.focus(); }}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === 'user' ? (
                  <div style={S.msgRow}>
                    <div style={S.avatarUser}>You</div>
                    <div style={S.bubbleUser}>{msg.content}</div>
                  </div>
                ) : (
                  <div style={S.msgRow}>
                    <div style={S.avatarBot}>DIG</div>
                    <div style={S.msgCol}>
                      {msg.error ? (
                        <div style={S.bubbleBot}><span style={{color:'#ef4444'}}>{msg.error}</span></div>
                      ) : msg.content ? (
                        <div style={S.bubbleBot}>
                          {/* Pillar 1: Meta Status + FRI */}
                          {msg.content.metaStatus && (
                            <div style={S.metaBanner}>
                              <div style={S.metaIcon}>{FOCUS_ICONS[msg.content.metaStatus.focus] || '🧠'}</div>
                              <div style={S.metaTexts}>
                                <span style={S.metaFocus}>FOCUS: {msg.content.metaStatus.focus?.toUpperCase()}</span>
                                <span style={S.metaRationale}>{msg.content.metaStatus.rationale}</span>
                              </div>
                              {msg.content.metaStatus.friScore !== undefined && (
                                <div style={{...S.friMini, color: msg.fri?.color || '#71717a'}}>
                                  {msg.fri?.icon || '⚪'} {msg.content.metaStatus.friScore}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Diagnosis */}
                          <div style={S.section}>
                            <div style={S.sectionLabel}>DIAGNOSIS</div>
                            <div style={S.diagnosis}>{msg.content.diagnosis}</div>
                          </div>

                          {/* Analysis */}
                          <div style={S.section}>
                            <div style={S.sectionLabel}>ANALYSIS</div>
                            <div style={S.analysis}>{msg.content.analysis}</div>
                          </div>

                          {/* Pillar 2: Cross-Links */}
                          {msg.content.crossLinks?.length > 0 && (
                            <div style={S.section}>
                              <div style={S.sectionLabel}>🔗 CROSS-LINKS</div>
                              <div style={S.crossLinks}>
                                {msg.content.crossLinks.map((cl, j) => (
                                  <div key={j} style={S.crossLinkCard}>
                                    <div style={S.clArea}>{cl.area}</div>
                                    <div style={S.clWhy}>{cl.why}</div>
                                    <div style={S.clAction}>→ {cl.action}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Plan */}
                          <div style={S.section}>
                            <div style={S.sectionLabel}>ACTION PLAN</div>
                            <div style={S.planList}>
                              {msg.content.actionPlan.map((step, j) => (
                                <div key={j} style={{
                                  ...S.planItem,
                                  ...(step.startsWith('[FRI]') ? S.friVerifyStep : {})
                                }}>
                                  <div style={S.planNum}>{j + 1}</div>
                                  <span>{step.replace(/^\[FRI\]\s*/, '')}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Risk Notes */}
                          {msg.content.riskNotes?.length > 0 && (
                            <div style={S.section}>
                              <div style={S.sectionLabel}>⚠️ RISKS</div>
                              {msg.content.riskNotes.map((r, j) => (
                                <div key={j} style={S.riskItem}>{r}</div>
                              ))}
                            </div>
                          )}

                          {/* Meta footer */}
                          <div style={S.resultFooter}>
                            <span>Confidence: <strong style={{color: msg.content.confidence > 75 ? '#22c55e' : msg.content.confidence > 50 ? '#eab308' : '#ef4444'}}>{msg.content.confidence}%</strong></span>
                            <div style={S.footerRight}>
                              {msg.fri && <span style={{color: msg.fri.color}}>FRI: {msg.fri.score}</span>}
                              {msg.meta && <span>{msg.meta.model} · {msg.meta.tokens}t</span>}
                            </div>
                          </div>

                          {/* Pillar 3: Feedback */}
                          <div style={S.feedbackRow}>
                            <span style={S.feedbackLabel}>Was this helpful?</span>
                            <button
                              onClick={() => handleFeedback(i, 'up')}
                              style={{ ...S.thumbBtn, ...(msg.feedback === 'up' ? S.thumbActiveUp : {}) }}
                            >👍</button>
                            <button
                              onClick={() => handleFeedback(i, 'down')}
                              style={{ ...S.thumbBtn, ...(msg.feedback === 'down' ? S.thumbActiveDown : {}) }}
                            >👎</button>
                            {msg.feedback && (
                              <span style={S.feedbackThanks}>Thanks for your feedback!</span>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={S.msgRow}>
                <div style={S.avatarBot}>DIG</div>
                <div style={S.bubbleBot}>
                  <div style={S.typing}>
                    <span style={S.dot} /><span style={{...S.dot, animationDelay:'0.2s'}} /><span style={{...S.dot, animationDelay:'0.4s'}} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={S.inputArea}>
            <form onSubmit={handleSubmit} style={S.inputForm}>
              <div style={S.inputRow}>
                <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown} placeholder="Describe your problem..."
                  style={S.inputField} rows={1} />
                <button type="submit" disabled={!input.trim() || loading}
                  style={{ ...S.sendBtn, ...((!input.trim() || loading) ? { opacity: 0.3, cursor: 'not-allowed' } : {}) }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
              <p style={S.disclaimer}>DIG v2.0 · FRI-Modulated Engine · Powered by OpenRouter</p>
            </form>
          </div>
        </main>
      </div>

      <style>{`
        @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        *{box-sizing:border-box}
        body{margin:0;padding:0;overflow:hidden}
        textarea{resize:none}
        ::-webkit-scrollbar{width:6px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#3f3f46;border-radius:3px}
      `}</style>
    </>
  );
}

// ═══════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════
const S = {
  page: { display:'flex', height:'100vh', fontFamily:"'Inter',-apple-system,sans-serif", background:'#09090b', color:'#e4e4e7', overflow:'hidden' },

  // Sidebar
  sidebar: { width:260, background:'#111113', borderRight:'1px solid #1f1f23', display:'flex', flexDirection:'column', flexShrink:0 },
  sidebarHeader: { display:'flex', alignItems:'center', gap:10, padding:'16px 18px', borderBottom:'1px solid #1f1f23' },
  logo: { fontSize:22, fontWeight:700, color:'#3b82f6' },
  logoText: { fontSize:18, fontWeight:700, color:'#fafafa', letterSpacing:'-0.02em' },
  sidebarNew: { display:'flex', alignItems:'center', gap:10, padding:'12px 18px', margin:'12px 10px', background:'#1a1a1f', border:'1px solid #27272a', borderRadius:8, fontSize:13, color:'#d4d4d8', cursor:'pointer' },
  plusIcon: { fontSize:16, color:'#71717a' },
  sidebarHistory: { flex:1, padding:'8px 10px', overflowY:'auto' },
  sidebarEmpty: { fontSize:12, color:'#3f3f46', textAlign:'center', padding:'20px 0' },
  sidebarItem: { fontSize:13, color:'#d4d4d8', padding:'10px 12px', background:'#1a1a1f', borderRadius:6, borderLeft:'2px solid #3b82f6', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },

  // FRI Sidebar
  friSidebar: { padding:'14px 18px', borderTop:'1px solid #1f1f23', borderBottom:'1px solid #1f1f23', margin:'0 0 0 0' },
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

  // Messages
  messages: { flex:1, overflowY:'auto', padding:'0 0 20px 0' },

  // Welcome
  welcome: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', padding:'40px 20px', textAlign:'center' },
  welcomeIcon: { fontSize:40, color:'#3b82f6', marginBottom:16 },
  welcomeTitle: { fontSize:24, fontWeight:700, color:'#fafafa', margin:'0 0 8px 0' },
  welcomeSub: { fontSize:14, color:'#71717a', margin:'0 0 20px 0' },

  // FRI Welcome Card
  friWelcomeCard: { background:'#111113', border:'1px solid', borderRadius:12, padding:'16px 20px', marginBottom:24, width:'100%', maxWidth:420 },
  friWelcomeRow: { display:'flex', alignItems:'center', gap:12 },
  friWelcomeScore: { fontSize:18, fontWeight:700 },
  friWelcomeDesc: { fontSize:12, color:'#71717a' },
  friWelcomeStats: { fontSize:11, color:'#52525b', marginTop:8, paddingTop:8, borderTop:'1px solid #1f1f23' },

  suggestions: { display:'flex', flexDirection:'column', gap:8, maxWidth:420, width:'100%' },
  suggestBtn: { background:'#111113', border:'1px solid #27272a', borderRadius:10, padding:'12px 16px', fontSize:13, color:'#a1a1aa', textAlign:'left', cursor:'pointer', fontFamily:'inherit' },

  // Message Rows
  msgRow: { display:'flex', padding:'8px 24px', gap:12, alignItems:'flex-start' },
  msgCol: { flex:1, minWidth:0 },
  avatarUser: { width:32, height:32, borderRadius:'50%', background:'#3b82f6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 },
  avatarBot: { width:32, height:32, borderRadius:'50%', background:'#1a1a1f', border:'1px solid #27272a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#a1a1aa', flexShrink:0 },
  bubbleUser: { background:'#2563eb', borderRadius:'18px 18px 4px 18px', padding:'10px 16px', fontSize:14, lineHeight:1.6, color:'#fff', maxWidth:'70%', wordBreak:'break-word' },
  bubbleBot: { background:'#141416', border:'1px solid #1f1f23', borderRadius:'18px 18px 18px 4px', padding:'14px 18px', fontSize:14, lineHeight:1.7, color:'#d4d4d8', maxWidth:'80%', wordBreak:'break-word' },

  // Meta Status Banner
  metaBanner: { display:'flex', alignItems:'center', gap:10, background:'#111113', border:'1px solid #1f1f23', borderRadius:8, padding:'10px 14px', marginBottom:14 },
  metaIcon: { fontSize:18, flexShrink:0 },
  metaTexts: { display:'flex', flexDirection:'column', gap:2, flex:1 },
  metaFocus: { fontSize:10, fontWeight:700, color:'#3b82f6', letterSpacing:'0.1em' },
  metaRationale: { fontSize:11, color:'#71717a', lineHeight:1.4 },
  friMini: { fontSize:12, fontWeight:700, flexShrink:0, borderLeft:'1px solid #1f1f23', paddingLeft:10, textAlign:'center', lineHeight:1.2 },

  // Sections
  section: { marginBottom:14 },
  sectionLabel: { fontSize:11, fontWeight:700, color:'#71717a', letterSpacing:'0.1em', marginBottom:6 },
  diagnosis: { fontSize:15, fontWeight:600, color:'#fafafa', lineHeight:1.5, borderLeft:'3px solid #ef4444', paddingLeft:12 },
  analysis: { fontSize:13, lineHeight:1.7, color:'#d4d4d8' },

  // Cross-Links
  crossLinks: { display:'flex', flexDirection:'column', gap:8 },
  crossLinkCard: { background:'#111113', border:'1px solid #1f1f23', borderRadius:8, padding:'10px 14px' },
  clArea: { fontSize:12, fontWeight:600, color:'#3b82f6', marginBottom:3 },
  clWhy: { fontSize:12, color:'#71717a', marginBottom:3 },
  clAction: { fontSize:12, color:'#a1a1aa' },

  // Action Plan
  planList: { display:'flex', flexDirection:'column', gap:8 },
  planItem: { display:'flex', alignItems:'flex-start', gap:10, fontSize:13, color:'#d4d4d8' },
  friVerifyStep: { background:'#7f1d1d15', border:'1px solid #ef444430', borderRadius:6, padding:'6px 8px', marginLeft:0 },
  planNum: { width:22, height:22, borderRadius:11, background:'#16a34a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 },

  // Risk
  riskItem: { fontSize:13, color:'#fbbf24', marginBottom:4, paddingLeft:4 },

  // Footer
  resultFooter: { display:'flex', justifyContent:'space-between', borderTop:'1px solid #1f1f23', marginTop:12, paddingTop:8, fontSize:11, color:'#3f3f46' },
  footerRight: { display:'flex', gap:12 },

  // Feedback
  feedbackRow: { display:'flex', alignItems:'center', gap:8, marginTop:10, paddingTop:10, borderTop:'1px solid #1f1f23' },
  feedbackLabel: { fontSize:12, color:'#52525b', marginRight:4 },
  thumbBtn: { background:'transparent', border:'1px solid #27272a', borderRadius:6, padding:'4px 10px', fontSize:16, cursor:'pointer', transition:'all 0.15s' },
  thumbActiveUp: { background:'#166534', borderColor:'#22c55e' },
  thumbActiveDown: { background:'#7f1d1d', borderColor:'#ef4444' },
  feedbackThanks: { fontSize:11, color:'#22c55e', marginLeft:4 },

  // Typing
  typing: { display:'flex', gap:4, padding:'4px 0' },
  dot: { width:7, height:7, borderRadius:'50%', background:'#52525b', animation:'bounce 1.2s infinite' },

  // Input
  inputArea: { padding:'0 24px 16px', flexShrink:0 },
  inputForm: { maxWidth:768, margin:'0 auto' },
  inputRow: { display:'flex', alignItems:'flex-end', background:'#111113', border:'1px solid #27272a', borderRadius:14, padding:'6px 6px 6px 16px' },
  inputField: { flex:1, background:'transparent', border:'none', outline:'none', color:'#fafafa', fontSize:14, fontFamily:'inherit', padding:'8px 0', lineHeight:1.5, maxHeight:120 },
  sendBtn: { width:36, height:36, borderRadius:10, background:'#3b82f6', border:'none', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 },
  disclaimer: { fontSize:11, color:'#3f3f46', textAlign:'center', margin:'8px 0 0 0' },
};
