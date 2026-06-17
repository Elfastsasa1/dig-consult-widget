import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';

// ═══════════════════════════════════════════
// DIG Chat Widget — ChatGPT-style UI
// ═══════════════════════════════════════════

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [urgency, setUrgency] = useState('medium');
  const [depth, setDepth] = useState('normal');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setLoading(true);

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);

    try {
      const res = await fetch('/api/dig/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: userMsg,
          context: userMsg,
          urgency,
          depth,
        }),
      });

      const data = await res.json();

      if (data.success && data.result) {
        const r = data.result;
        // Build markdown-style response
        let botReply = `**DIAGNOSIS**\n${r.diagnosis}\n\n`;
        botReply += `**ANALYSIS**\n${r.analysis}\n\n`;
        botReply += `**ACTION PLAN**\n`;
        r.actionPlan.forEach((step, i) => {
          botReply += `${i + 1}. ${step}\n`;
        });
        if (r.riskNotes.length > 0) {
          botReply += `\n**RISK NOTES**\n`;
          r.riskNotes.forEach((risk) => {
            botReply += `⚠ ${risk}\n`;
          });
        }
        botReply += `\n---\nConfidence: ${r.confidence}% | Model: ${r.meta?.model || 'unknown'}`;

        setMessages((prev) => [...prev, { role: 'assistant', content: botReply, result: r, meta: r.meta }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${data.error || 'Consultation failed'}` }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Network error: ${err.message}` }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      <Head>
        <title>DIG — AI Consultation</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>

      <div style={S.page}>
        {/* Sidebar */}
        <aside style={S.sidebar}>
          <div style={S.sidebarHeader}>
            <div style={S.logo}>⬡</div>
            <span style={S.logoText}>DIG</span>
          </div>
          <div style={S.sidebarNew} onClick={() => { setMessages([]); setInput(''); }}>
            <span style={S.sidebarNewIcon}>+</span>
            New Chat
          </div>
          <div style={S.sidebarHistory}>
            {messages.length === 0 && (
              <div style={S.sidebarEmpty}>No conversations yet</div>
            )}
            {messages.length > 0 && (
              <div style={S.sidebarItemActive}>
                {messages[0]?.content?.substring(0, 35) || 'New conversation'}...
              </div>
            )}
          </div>
          <div style={S.sidebarFooter}>
            <div style={S.sidebarFooterDot} />
            <span style={S.sidebarFooterText}>DIG v1.0</span>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main style={S.main}>
          {/* Top Bar */}
          <header style={S.topbar}>
            <div style={S.topbarLeft}>
              <span style={S.topbarModel}>DIG Consultation</span>
              <span style={S.topbarSep}>·</span>
              <span style={S.topbarStatus}>Online</span>
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
                  {['low', 'medium', 'high', 'critical'].map((u) => (
                    <button
                      key={u}
                      onClick={() => setUrgency(u)}
                      style={{
                        ...S.pill,
                        ...(urgency === u ? S.pillActive : {}),
                        ...(urgency === u ? { background: '#3b82f6', color: '#fff', borderColor: '#3b82f6' } : {}),
                      }}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <div style={S.settingsRow}>
                <span style={S.settingsLabel}>Depth</span>
                <div style={S.pillGroup}>
                  {['surface', 'normal', 'deep'].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDepth(d)}
                      style={{
                        ...S.pill,
                        ...(depth === d ? S.pillActive : {}),
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div style={S.messages}>
            {messages.length === 0 && (
              <div style={S.welcome}>
                <div style={S.welcomeIcon}>⬡</div>
                <h2 style={S.welcomeTitle}>How can I help you today?</h2>
                <p style={S.welcomeSub}>Describe your problem and get a diagnosis-first analysis.</p>
                <div style={S.suggestions}>
                  {[
                    'My VPS keeps crashing at night',
                    'How to secure my crypto wallet?',
                    'My trading bot has too many false signals',
                    'Analyze this project architecture',
                  ].map((s) => (
                    <button key={s} style={S.suggestionBtn} onClick={() => { setInput(s); inputRef.current?.focus(); }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={msg.role === 'user' ? S.msgUser : S.msgAssistant}>
                <div style={msg.role === 'user' ? S.avatarUser : S.avatarAssistant}>
                  {msg.role === 'user' ? 'You' : 'DIG'}
                </div>
                <div style={msg.role === 'user' ? S.bubbleUser : S.bubbleAssistant}>
                  {msg.role === 'user' ? (
                    <span>{msg.content}</span>
                  ) : (
                    <RenderMarkdown text={msg.content} result={msg.result} meta={msg.meta} />
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div style={S.msgAssistant}>
                <div style={S.avatarAssistant}>DIG</div>
                <div style={S.bubbleAssistant}>
                  <div style={S.typing}>
                    <span style={S.dot} />
                    <span style={{...S.dot, animationDelay: '0.2s'}} />
                    <span style={{...S.dot, animationDelay: '0.4s'}} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={S.inputArea}>
            <form onSubmit={handleSubmit} style={S.inputForm}>
              <div style={S.inputWrapper}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your problem..."
                  style={S.inputField}
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  style={{
                    ...S.sendBtn,
                    ...((!input.trim() || loading) ? S.sendBtnDisabled : {}),
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
              <p style={S.disclaimer}>DIG provides analysis for educational purposes. Always verify critical decisions.</p>
            </form>
          </div>
        </main>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; overflow: hidden; }
        textarea { resize: none; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #52525b; }
      `}</style>
    </>
  );
}

// Simple markdown renderer
function RenderMarkdown({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let inList = false;
  let listItems = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ol key={`list-${elements.length}`} style={S.mdList}>
          {listItems.map((item, j) => (
            <li key={j} style={S.mdListItem}>{renderInline(item)}</li>
          ))}
        </ol>
      );
      listItems = [];
      inList = false;
    }
  };

  lines.forEach((line, i) => {
    if (line.startsWith('---')) {
      flushList();
      elements.push(<hr key={i} style={S.mdHr} />);
    } else if (/^\d+\.\s/.test(line)) {
      inList = true;
      listItems.push(line.replace(/^\d+\.\s/, ''));
    } else if (line.startsWith('**') && line.endsWith('**')) {
      flushList();
      elements.push(<div key={i} style={S.mdHeading}>{renderInline(line)}</div>);
    } else if (line.startsWith('⚠')) {
      flushList();
      elements.push(<div key={i} style={S.mdRisk}>{renderInline(line)}</div>);
    } else if (line.trim() === '') {
      flushList();
    } else {
      flushList();
      elements.push(<div key={i} style={S.mdPara}>{renderInline(line)}</div>);
    }
  });
  flushList();

  return <div>{elements}</div>;
}

function renderInline(text) {
  // Bold
  const parts = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(<strong key={match.index} style={{ color: '#fafafa' }}>{match[1]}</strong>);
    lastIndex = regex.lastIndex;
  }
  parts.push(text.slice(lastIndex));
  return parts;
}

// ═══════════════════════════════════════════
// Styles — ChatGPT / Claude inspired
// ═══════════════════════════════════════════

const S = {
  // Layout
  page: {
    display: 'flex',
    height: '100vh',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    background: '#09090b',
    color: '#e4e4e7',
    overflow: 'hidden',
  },

  // Sidebar
  sidebar: {
    width: 260,
    background: '#111113',
    borderRight: '1px solid #1f1f23',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '16px 18px',
    borderBottom: '1px solid #1f1f23',
  },
  logo: {
    fontSize: 22,
    fontWeight: 700,
    color: '#3b82f6',
  },
  logoText: {
    fontSize: 18,
    fontWeight: 700,
    color: '#fafafa',
    letterSpacing: '-0.02em',
  },
  sidebarNew: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 18px',
    margin: '12px 10px',
    background: '#1a1a1f',
    border: '1px solid #27272a',
    borderRadius: 8,
    fontSize: 13,
    color: '#d4d4d8',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  sidebarNewIcon: {
    fontSize: 16,
    color: '#71717a',
  },
  sidebarHistory: {
    flex: 1,
    padding: '8px 10px',
    overflowY: 'auto',
  },
  sidebarEmpty: {
    fontSize: 12,
    color: '#3f3f46',
    textAlign: 'center',
    padding: '20px 0',
  },
  sidebarItemActive: {
    fontSize: 13,
    color: '#d4d4d8',
    padding: '10px 12px',
    background: '#1a1a1f',
    borderRadius: 6,
    borderLeft: '2px solid #3b82f6',
    marginBottom: 4,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  sidebarFooter: {
    padding: '14px 18px',
    borderTop: '1px solid #1f1f23',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  sidebarFooterDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#22c55e',
  },
  sidebarFooterText: {
    fontSize: 11,
    color: '#52525b',
  },

  // Main
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },

  // Topbar
  topbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    borderBottom: '1px solid #1f1f23',
    background: '#09090b',
    flexShrink: 0,
  },
  topbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  topbarModel: {
    fontSize: 14,
    fontWeight: 600,
    color: '#fafafa',
  },
  topbarSep: {
    color: '#3f3f46',
    fontSize: 14,
  },
  topbarStatus: {
    fontSize: 12,
    color: '#22c55e',
  },
  settingsBtn: {
    background: 'transparent',
    border: '1px solid #27272a',
    borderRadius: 6,
    padding: '6px 12px',
    fontSize: 12,
    color: '#a1a1aa',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  // Settings Panel
  settingsPanel: {
    padding: '14px 24px',
    background: '#111113',
    borderBottom: '1px solid #1f1f23',
    display: 'flex',
    gap: 24,
    flexWrap: 'wrap',
    flexShrink: 0,
  },
  settingsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  settingsLabel: {
    fontSize: 12,
    color: '#71717a',
    fontWeight: 500,
    minWidth: 55,
  },
  pillGroup: {
    display: 'flex',
    gap: 6,
  },
  pill: {
    padding: '4px 12px',
    borderRadius: 16,
    border: '1px solid #27272a',
    background: 'transparent',
    color: '#71717a',
    fontSize: 11,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    textTransform: 'capitalize',
  },
  pillActive: {
    color: '#fafafa',
    borderColor: '#3b82f6',
  },

  // Messages
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 0 20px 0',
  },

  // Welcome
  welcome: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '40px 20px',
    textAlign: 'center',
  },
  welcomeIcon: {
    fontSize: 40,
    color: '#3b82f6',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#fafafa',
    margin: '0 0 8px 0',
  },
  welcomeSub: {
    fontSize: 14,
    color: '#71717a',
    margin: '0 0 28px 0',
  },
  suggestions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    maxWidth: 420,
    width: '100%',
  },
  suggestionBtn: {
    background: '#111113',
    border: '1px solid #27272a',
    borderRadius: 10,
    padding: '12px 16px',
    fontSize: 13,
    color: '#a1a1aa',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.15s, border-color 0.15s',
  },

  // Message Bubbles
  msgUser: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '16px 24px',
    gap: 12,
  },
  msgAssistant: {
    display: 'flex',
    justifyContent: 'flex-start',
    padding: '8px 24px 16px 24px',
    gap: 12,
  },
  avatarUser: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: '#3b82f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 700,
    color: '#fff',
    flexShrink: 0,
  },
  avatarAssistant: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: '#1a1a1f',
    border: '1px solid #27272a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    fontWeight: 700,
    color: '#a1a1aa',
    flexShrink: 0,
  },
  bubbleUser: {
    background: '#2563eb',
    borderRadius: '18px 18px 4px 18px',
    padding: '10px 16px',
    fontSize: 14,
    lineHeight: 1.6,
    color: '#fff',
    maxWidth: '70%',
    wordBreak: 'break-word',
  },
  bubbleAssistant: {
    background: '#141416',
    border: '1px solid #1f1f23',
    borderRadius: '18px 18px 18px 4px',
    padding: '14px 18px',
    fontSize: 14,
    lineHeight: 1.7,
    color: '#d4d4d8',
    maxWidth: '80%',
    wordBreak: 'break-word',
  },

  // Typing indicator
  typing: {
    display: 'flex',
    gap: 4,
    padding: '4px 0',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#52525b',
    animation: 'bounce 1.2s infinite',
  },

  // Input Area
  inputArea: {
    padding: '0 24px 16px 24px',
    flexShrink: 0,
  },
  inputForm: {
    maxWidth: 768,
    margin: '0 auto',
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'flex-end',
    background: '#111113',
    border: '1px solid #27272a',
    borderRadius: 14,
    padding: '6px 6px 6px 16px',
    transition: 'border-color 0.2s',
  },
  inputField: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#fafafa',
    fontSize: 14,
    fontFamily: 'inherit',
    padding: '8px 0',
    lineHeight: 1.5,
    maxHeight: 120,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: '#3b82f6',
    border: 'none',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background 0.15s',
  },
  sendBtnDisabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
  },
  disclaimer: {
    fontSize: 11,
    color: '#3f3f46',
    textAlign: 'center',
    margin: '8px 0 0 0',
  },

  // Markdown
  mdHeading: {
    fontWeight: 700,
    fontSize: 13,
    color: '#a1a1aa',
    letterSpacing: '0.08em',
    marginTop: 14,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  mdPara: {
    marginBottom: 8,
  },
  mdList: {
    margin: '4px 0 10px 0',
    paddingLeft: 20,
    listStyleType: 'decimal',
  },
  mdListItem: {
    marginBottom: 4,
    lineHeight: 1.6,
    color: '#d4d4d8',
  },
  mdHr: {
    border: 'none',
    borderTop: '1px solid #1f1f23',
    margin: '12px 0',
  },
  mdRisk: {
    color: '#fbbf24',
    fontSize: 13,
    lineHeight: 1.6,
    marginBottom: 4,
    paddingLeft: 2,
  },
};
