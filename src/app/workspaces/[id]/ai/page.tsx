'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAIInsights, useProducts } from '@/hooks/useQueries';
import { chatWithAI, forecastDepletion } from '@/lib/actions/ai';
import { Header } from '@/components/layout/Header';
import { Badge, Skeleton } from '@/components/ui/Badge';
import { Sparkles, Send, Bot, Package, User } from 'lucide-react';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

function MarkdownContent({ text }: { text: string }) {
  const html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.*?)$/gm, '• $1')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
  return <div dangerouslySetInnerHTML={{ __html: html }} style={{ lineHeight: 1.6 }} />;
}

export default function AIPage() {
  const params = useParams();
  const workspaceId = params.id as string | undefined;
  const { data: insights, isLoading: insightsLoading } = useAIInsights(workspaceId);
  const { data: products } = useProducts(workspaceId);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'assistant', content: 'Hi! I\'m your ChiaHustle AI assistant. Ask me about inventory, pricing, trends, or marketing tips.' },
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [forecastProduct, setForecastProduct] = useState('');
  const [forecastResult, setForecastResult] = useState('');
  const [forecastLoading, setForecastLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, chatLoading]);

  const sendMessage = async () => {
    if (!input.trim() || chatLoading) return;
    const userMsg: ChatMsg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setChatLoading(true);
    
    try {
      if (!workspaceId) return;
      const response = await chatWithAI(
        workspaceId,
        newMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      );
      setMessages((prev) => [...prev, { role: 'assistant', content: response.content || '' }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Connection lost. Please check your internet or API key.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const runForecast = async () => {
    if (!forecastProduct || !workspaceId) return;
    setForecastLoading(true);
    setForecastResult('');
    try {
      const result = await forecastDepletion(workspaceId, forecastProduct);
      setForecastResult(result);
    } catch (e) {
      setForecastResult('Service temporarily unavailable.');
    } finally {
      setForecastLoading(false);
    }
  };

  const urgencyColor = (u: string) =>
    u === 'high' ? 'red' : u === 'medium' ? 'yellow' : 'gray';

  const insightIcon = (type: string) => {
    if (type === 'restock') return '📦';
    if (type === 'pricing') return '💰';
    if (type === 'trend') return '📈';
    if (type === 'churn') return '⚠️';
    return '✨';
  };

  return (
    <div className="page-enter">
      <Header title="AI Insights">
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Powered by Arbitury Intelligence</span>
        </div>
      </Header>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Insights panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="ai-card">
              <div className="card-header">
                <div className="card-title">Smart Alerts</div>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Live recommendations</span>
              </div>
              {insightsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} height={60} />)}
                </div>
              ) : (
                <div>
                  {insights?.map((ins: any) => (
                    <div key={ins.id} className="ai-insight-row">
                      <div className="ai-icon">
                        <span style={{ fontSize: 14 }}>{insightIcon(ins.type)}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{ins.title}</span>
                          <Badge variant={urgencyColor(ins.urgency) as any}>{ins.urgency}</Badge>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-2)', textWrap: "auto" }}>{ins.description}</div>
                        {ins.action && (
                          <button className="btn btn-secondary btn-sm mt-2" style={{ textWrap: "auto",textAlign:"left"}}>{ins.action}</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Depletion Forecast */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Depletion Forecast</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <select
                  className="form-input"
                  value={forecastProduct}
                  onChange={(e) => setForecastProduct(e.target.value)}
                >
                  <option value="">Select a product…</option>
                  {products?.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button
                  className="btn btn-primary"
                  onClick={runForecast}
                  disabled={!forecastProduct || forecastLoading}
                >
                  <Package size={13} />
                  {forecastLoading ? 'Analyzing…' : 'Run Forecast'}
                </button>
                {forecastResult && (
                  <div style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '12px',
                    fontSize: 13,
                    color: 'var(--text)',
                  }}>
                    <MarkdownContent text={forecastResult} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Chatbot */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 600 }}>
            <div className="card-header" style={{ marginBottom: 0, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <Bot size={15} style={{ color: 'var(--primary)' }} />
                <div className="card-title">AI Assistant</div>
              </div>
              <Badge variant="green">Live</Badge>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div style={{
                    maxWidth: '85%',
                    background: msg.role === 'user' ? 'var(--primary-dim)' : 'var(--surface-2)',
                    border: `1px solid ${msg.role === 'user' ? 'rgba(88,166,255,0.2)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius)',
                    padding: '8px 12px',
                    fontSize: 13,
                    color: msg.role === 'user' ? 'var(--primary)' : 'var(--text)',
                    lineHeight: 1.5,
                  }}>
                    <MarkdownContent text={msg.content} />
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex' }}>
                  <div style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '8px 12px',
                    fontSize: 13,
                    color: 'var(--text-3)',
                  }}>
                    Thinking…
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{
              borderTop: '1px solid var(--border)',
              paddingTop: 12,
              display: 'flex',
              gap: 8,
            }}>
              <input
                className="form-input"
                placeholder="Ask about pricing, demand, churn…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button className="btn btn-primary" onClick={sendMessage} disabled={chatLoading || !input.trim()}>
                <Send size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
