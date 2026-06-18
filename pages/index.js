import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';

// ═══════════════════════════════════════════
// DIG Chat v3.0 — Clean Conversational UI
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

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
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
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const res = await fetch('/api/dig/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: userMsg, context: userMsg, urgency: 'medium', depth: 'normal' }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        setMessages((prev) => [...prev, { role: 'assistant', content: null, error: `Server error (${res.status}). Try again.` }]);
        return;
      }
      const data = await res.json();
      if (data.success && data.text) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.text, meta: data.meta, feedback: null }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: null, error: data.error || 'Something went wrong. Try again.' }]);
      }
    } catch (err) {
      const msg = err.name === 'AbortError' ? 'Request timed out. Try a shorter question.' : `Connection error. Try again.`;
      setMessages((prev) => [...prev, { role: 'assistant', content: null, error: msg }]);
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
        body: JSON.stringify({ messageIndex: msgIdx, userMessage: messages[msgIdx - 1]?.content || '', diagnosis: msg.content || '', rating }),
      });
      setTimeout(fetchFRI, 500);
    } catch (e) {}
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const P = isMobile ? MP : DP;

  return (
    <>
      <Head>
        <title>DIG-TWO — Contextual Reality Engine</title>
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
            <span style={P.logoText}>DIG-TWO</span>
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
            <span style={P.footerText}>DIG v3.0</span>
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
              <span style={P.topbarTitle}>DIG-TWO</span>
            </div>
          </header>

          {/* Messages */}
          <div style={P.messages}>
            {messages.length === 0 && (
              <div style={P.welcome}>
                <div style={P.welcomeIcon}>⬡</div>
                <h2 style={P.welcomeTitle}>Contextual Reality Engine</h2>
                <p style={P.welcomeSub}>Contextual Reality — bukan sekadar jawaban. Tanpa sensor, tanpa kompromi.</p>
                <div style={P.suggestions}>
                  {['Analisis risiko hidden dalam smart contract', 'Kenapa sensor AI itu ada dan gimana cara kerjanya?', 'Bedah arsitektur sistem trading yang profitabel', 'Cross-link: bagaimana politik mempengaruhi harga crypto'].map(s => (
                    <button key={s} style={P.suggestBtn} onClick={() => { setInput(s); inputRef.current?.focus(); }}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === 'user' ? (
                  <div style={P.msgRow}>
                    <div style={P.bubbleUser}>{msg.content}</div>
                  </div>
                ) : (
                  <div style={P.msgRow}>
                    <div style={P.msgCol}>
                      {msg.error ? (
                        <div style={P.bubbleBot}><span style={{color:'#ef4444'}}>{msg.error}</span></div>
                      ) : msg.content ? (
                        <div style={P.bubbleBot}>
                          <div style={P.responseText}>{msg.content}</div>

                          {/* Feedback */}
                          <div style={P.feedbackRow}>
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
              {!isMobile && <p style={P.disclaimer}>DIG v3.0 · Powered by OpenRouter</p>}
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
      `}</style>
    </>
  );
}


// ═══════════════════════════════════════════
// DESKTOP STYLES
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

  messages: { flex:1, overflowY:'auto', padding:'20px 0' },

  // Welcome
  welcome: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', padding:'40px 20px', textAlign:'center' },
  welcomeIcon: { fontSize:40, color:'#3b82f6', marginBottom:16 },
  welcomeTitle: { fontSize:24, fontWeight:700, color:'#fafafa', margin:'0 0 8px 0' },
  welcomeSub: { fontSize:14, color:'#71717a', margin:'0 0 24px 0' },
  suggestions: { display:'flex', flexDirection:'column', gap:8, maxWidth:420, width:'100%' },
  suggestBtn: { background:'#111113', border:'1px solid #27272a', borderRadius:10, padding:'12px 16px', fontSize:13, color:'#a1a1aa', textAlign:'left', cursor:'pointer', fontFamily:'inherit' },

  msgRow: { display:'flex', padding:'6px 24px', justifyContent:'flex-end' },
  msgCol: { maxWidth:'80%', minWidth:0 },
  bubbleUser: { background:'#2563eb', borderRadius:'18px 18px 4px 18px', padding:'10px 16px', fontSize:14, lineHeight:1.6, color:'#fff', maxWidth:'100%', wordBreak:'break-word' },
  bubbleBot: { background:'#1a1a1f', border:'1px solid #1f1f23', borderRadius:'18px 18px 18px 4px', padding:'14px 18px', fontSize:14, lineHeight:1.7, color:'#d4d4d8', maxWidth:'100%', wordBreak:'break-word' },

  responseText: { whiteSpace:'pre-wrap', fontSize:14, lineHeight:1.7, color:'#d4d4d8' },

  feedbackRow: { display:'flex', alignItems:'center', gap:6, marginTop:10, paddingTop:8, borderTop:'1px solid #1f1f23' },
  thumbBtn: { background:'transparent', border:'1px solid #27272a', borderRadius:6, padding:'3px 8px', fontSize:14, cursor:'pointer', transition:'all 0.15s' },
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
// MOBILE STYLES
// ═══════════════════════════════════════════
const MP = {
  ...DP,
  page: { ...DP.page, overflow:'hidden' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:99, WebkitTapHighlightColor:'transparent' },

  sidebar: { ...DP.sidebar, width:280, position:'fixed', top:0, left:0, bottom:0, zIndex:100, transform:'translateX(-100%)', transition:'transform 0.25s ease' },
  sidebarHeader: { ...DP.sidebarHeader, padding:'14px 16px' },
  closeBtn: { display:'block', marginLeft:'auto', fontSize:18, color:'#71717a', cursor:'pointer', padding:'4px 8px' },
  sidebarNew: { ...DP.sidebarNew, margin:'10px 12px', padding:'10px 14px' },

  topbar: { ...DP.topbar, padding:'10px 14px' },
  hamburger: { display:'block', background:'transparent', border:'1px solid #27272a', borderRadius:6, padding:'6px 10px', fontSize:18, color:'#a1a1aa', cursor:'pointer', lineHeight:1 },

  messages: { ...DP.messages, padding:'0 0 12px 0' },
  welcome: { ...DP.welcome, padding:'24px 16px' },
  welcomeIcon: { fontSize:32, color:'#3b82f6', marginBottom:12 },
  welcomeTitle: { fontSize:20, fontWeight:700, color:'#fafafa', margin:'0 0 6px 0' },
  welcomeSub: { fontSize:13, color:'#71717a', margin:'0 0 16px 0' },
  suggestions: { ...DP.suggestions, maxWidth:'100%' },
  suggestBtn: { ...DP.suggestBtn, padding:'10px 14px', fontSize:12 },

  msgRow: { padding:'4px 12px', justifyContent:'flex-end' },
  msgCol: { maxWidth:'90%' },
  bubbleUser: { ...DP.bubbleUser, fontSize:13, padding:'8px 12px', borderRadius:'14px 14px 4px 14px' },
  bubbleBot: { ...DP.bubbleBot, fontSize:13, padding:'10px 12px', borderRadius:'14px 14px 14px 4px' },
  responseText: { ...DP.responseText, fontSize:13 },

  feedbackRow: { ...DP.feedbackRow, flexWrap:'wrap', gap:6 },

  inputArea: { padding:'8px 12px', paddingBottom:'max(8px, env(safe-area-inset-bottom))', flexShrink:0, background:'#09090b', borderTop:'1px solid #1f1f23', position:'relative', zIndex:10 },
  inputForm: { maxWidth:'100%', margin:'0 auto' },
  inputRow: { display:'flex', alignItems:'flex-end', background:'#111113', border:'1px solid #27272a', borderRadius:14, padding:'6px 6px 6px 14px', minHeight:44 },
  inputField: { flex:1, background:'transparent', border:'none', outline:'none', color:'#fafafa', fontSize:16, fontFamily:'inherit', padding:'8px 0', lineHeight:1.5, maxHeight:120, WebkitAppearance:'none', appearance:'none', WebkitTapHighlightColor:'transparent' },
  sendBtn: { width:36, height:36, borderRadius:10, background:'#3b82f6', border:'none', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, WebkitTapHighlightColor:'transparent' },
};
