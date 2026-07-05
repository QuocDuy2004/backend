import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Send, Sparkles, User, ShieldAlert, Check, RefreshCw, 
  UserCheck, AlertOctagon, CornerDownRight, Heart, BrainCircuit, Activity, Clock,
  ChevronLeft
} from 'lucide-react';
import { SupportTicket, SupportMessage } from '../../../types';

interface SupportCenterProps {
  tickets: SupportTicket[];
  onUpdateTicket: (updatedTicket: SupportTicket) => void;
  products: any[];
}

export default function SupportCenter({ tickets, onUpdateTicket, products }: SupportCenterProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string>(tickets[0]?.id || '');
  const [draft, setDraft] = useState('');
  
  // Mobile active view state
  const [mobileActiveView, setMobileActiveView] = useState<'list' | 'chat' | 'copilot'>('list');
  
  // AI suggestions states
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    sentiment: string;
    sentimentScore: number;
    intent: string;
    confidenceScore: number;
    summary: string;
    suggestedReply: string;
    recommendedActions: string[];
  } | null>(null);

  const activeTicket = tickets.find(t => t.id === selectedTicketId) || tickets[0];
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to chat end
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTicket?.messages]);

  // Trigger AI Analysis when ticket switches or messages change
  useEffect(() => {
    if (activeTicket) {
      triggerAICopilotAnalysis();
    }
  }, [selectedTicketId, activeTicket?.messages?.length]);

  const triggerAICopilotAnalysis = async () => {
    if (!activeTicket) return;
    setAnalyzing(true);
    try {
      const response = await fetch('/api/ai/suggest-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: activeTicket.customerName,
          customerEmail: activeTicket.customerEmail,
          messages: activeTicket.messages
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setAiAnalysis(data);

      // Map back generated metrics into the active ticket state
      const updated: SupportTicket = {
        ...activeTicket,
        sentiment: data.sentiment || 'neutral',
        sentimentScore: data.sentimentScore || 0,
        intent: data.intent || 'General Support',
        confidenceScore: data.confidenceScore || 90
      };
      onUpdateTicket(updated);
    } catch (err) {
      console.error('AI Support copilot analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSendMessage = (sender: 'agent' | 'ai') => {
    if (!draft.trim() || !activeTicket) return;

    const newMessage: SupportMessage = {
      id: `msg_${Date.now()}`,
      sender,
      text: draft,
      timestamp: new Date().toISOString()
    };

    const updatedTicket: SupportTicket = {
      ...activeTicket,
      lastMessage: draft,
      updatedAt: new Date().toISOString(),
      messages: [...activeTicket.messages, newMessage]
    };

    onUpdateTicket(updatedTicket);
    setDraft('');

    // If sending manually as human, or if AI Auto-respond isn't locked, simulate simulated customer continuation
    if (sender === 'agent') {
      simulateCustomerReply(updatedTicket);
    }
  };

  const simulateCustomerReply = (ticket: SupportTicket) => {
    setTimeout(() => {
      const answers = [
        "That works for me, thank you. When will I see the status reflect in my tracking app?",
        "Okay I understand, but is there any way to expedite it? I really need this yoga mat by Friday.",
        "Yes, the email address is indeed correct. Please go ahead and send the voucher code there."
      ];
      const randomMsg = answers[Math.floor(Math.random() * answers.length)];
      
      const replyMessage: SupportMessage = {
        id: `msg_cust_${Date.now()}`,
        sender: 'customer',
        text: randomMsg,
        timestamp: new Date().toISOString()
      };

      const updatedWithReply: SupportTicket = {
        ...ticket,
        lastMessage: randomMsg,
        updatedAt: new Date().toISOString(),
        messages: [...ticket.messages, replyMessage]
      };
      onUpdateTicket(updatedWithReply);
    }, 2500);
  };

  const applySuggestedReply = () => {
    if (aiAnalysis?.suggestedReply) {
      setDraft(aiAnalysis.suggestedReply);
    }
  };

  const handleEscalate = () => {
    if (!activeTicket) return;
    const updated: SupportTicket = {
      ...activeTicket,
      priority: 'urgent',
      assignedToAI: false,
      notes: `${activeTicket.notes || ''}\n[Escalated to human tier by Operative on ${new Date().toLocaleTimeString()}]`
    };
    onUpdateTicket(updated);
    alert('Ticket escalated to Tier-2 supervisor queue. AI Auto-responder deactivated.');
  };

  const toggleAutoReply = () => {
    if (!activeTicket) return;
    const updated: SupportTicket = {
      ...activeTicket,
      assignedToAI: !activeTicket.assignedToAI
    };
    onUpdateTicket(updated);
  };

  const handleSolveTicket = () => {
    if (!activeTicket) return;
    const updated: SupportTicket = {
      ...activeTicket,
      status: 'solved'
    };
    onUpdateTicket(updated);
  };

  // Sentiment mapping helper
  const sentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😠';
      default: return '😐';
    }
  };

  const priorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
      
      {/* COLUMN 1: Conversation List (Width: 30%) */}
      <div className={`w-full md:w-80 border-r border-slate-200 flex flex-col h-full bg-slate-50/50 ${mobileActiveView === 'list' ? 'flex' : 'hidden md:flex'}`}>
        <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-4.5 h-4.5 text-blue-600" />
            Support Conversations
          </h3>
          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
            {tickets.length} Active
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {tickets.map(t => {
            const isSelected = t.id === selectedTicketId;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setSelectedTicketId(t.id);
                  setMobileActiveView('chat');
                }}
                className={`w-full p-4 text-left flex flex-col gap-1.5 transition-all outline-none ${
                  isSelected ? 'bg-white border-l-4 border-blue-600 shadow-xs' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{t.customerName}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono text-slate-400 font-semibold">{t.id}</span>
                    <span>{sentimentEmoji(t.sentiment)}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {t.lastMessage}
                </p>

                <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-100/50 text-[10px] text-slate-400 font-semibold">
                  <span className={`px-1.5 py-0.5 rounded-sm uppercase tracking-wide border text-[9px] ${priorityColor(t.priority)}`}>
                    {t.priority}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    SLA: {t.slaMinutesRemaining}m
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* COLUMN 2: Live Chat Window (Width: 45%) */}
      <div className={`flex-1 flex flex-col h-full bg-slate-50 ${mobileActiveView === 'chat' ? 'flex' : 'hidden md:flex'}`}>
        {activeTicket ? (
          <>
            {/* Chat header */}
            <div className="px-4 md:px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => setMobileActiveView('list')}
                  className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-800 transition-colors shrink-0"
                  title="Quay lại danh sách"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="truncate">
                  <h4 className="text-sm font-bold text-slate-800 truncate">{activeTicket.customerName}</h4>
                  <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">{activeTicket.customerEmail}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Mobile Copilot Trigger */}
                <button
                  onClick={() => setMobileActiveView('copilot')}
                  className="md:hidden p-1.5 rounded-lg text-amber-700 bg-amber-50 border border-amber-200 flex items-center justify-center transition-colors hover:bg-amber-100"
                  title="Xem AI Copilot"
                >
                  <BrainCircuit className="w-4 h-4 text-amber-500" />
                </button>

                <button
                  onClick={toggleAutoReply}
                  className={`hidden md:flex px-3 py-1.5 rounded-lg text-xs font-semibold items-center gap-1.5 border transition-all ${
                    activeTicket.assignedToAI
                      ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <BrainCircuit className="w-4 h-4 text-amber-500" />
                  {activeTicket.assignedToAI ? 'AI Co-pilot: Active' : 'Enable AI Assist'}
                </button>
                <button
                  onClick={handleSolveTicket}
                  disabled={activeTicket.status === 'solved'}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold border transition-colors ${
                    activeTicket.status === 'solved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100 cursor-not-allowed'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {activeTicket.status === 'solved' ? '✓ Solved' : 'Resolve'}
                </button>
              </div>
            </div>

            {/* Support Message history */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeTicket.messages.map((m, i) => {
                const isCustomer = m.sender === 'customer';
                const isAI = m.sender === 'ai';
                return (
                  <div key={i} className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}>
                    <div className="max-w-[75%] flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 px-1">
                        {isCustomer ? (
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Customer</span>
                        ) : isAI ? (
                          <span className="text-[10px] font-bold text-amber-600 uppercase flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            AI Co-pilot
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-blue-600 uppercase">Agent (You)</span>
                        )}
                        <span className="text-[9px] text-slate-400 font-mono">
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isCustomer
                          ? 'bg-white text-slate-800 rounded-tl-sm border border-slate-200/80 shadow-xs'
                          : isAI
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-tr-sm shadow-sm'
                          : 'bg-blue-600 text-white rounded-tr-sm shadow-sm'
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Smart Suggested reply pill */}
            {aiAnalysis?.suggestedReply && activeTicket.status !== 'solved' && (
              <div className="mx-6 mb-3 p-3 bg-amber-50 border border-amber-100 rounded-xl space-y-2 flex flex-col shrink-0 text-xs">
                <div className="flex items-center justify-between text-amber-950 font-bold">
                  <span className="flex items-center gap-1 text-amber-800">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    AI Copilot Recommendation
                  </span>
                  <button 
                    onClick={applySuggestedReply}
                    className="text-[10px] font-extrabold text-amber-600 bg-white hover:bg-amber-100 px-2 py-1 rounded-sm border border-amber-200 transition-colors shadow-xs"
                  >
                    Use Draft Reply
                  </button>
                </div>
                <p className="text-amber-900 leading-relaxed max-h-[60px] overflow-y-auto scrollbar-thin italic">
                  "{aiAnalysis.suggestedReply}"
                </p>
              </div>
            )}

            {/* Chat draft input */}
            {activeTicket.status !== 'solved' ? (
              <div className="p-4 border-t border-slate-200 bg-white flex gap-3 shrink-0 items-center">
                <textarea
                  rows={1}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none resize-none bg-slate-50 focus:bg-white"
                  placeholder="Draft response..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage('agent');
                    }
                  }}
                />
                <button
                  onClick={() => handleSendMessage('agent')}
                  className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-sm flex items-center justify-center shrink-0"
                >
                  <Send className="w-4.5 h-4.5" />
                </button>
              </div>
            ) : (
              <div className="p-4 border-t border-slate-200 bg-emerald-50 text-emerald-800 text-center font-semibold text-xs shrink-0">
                ✓ Case has been resolved successfully. Live chat closed.
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <MessageSquare className="w-12 h-12 text-slate-300 stroke-1 mb-2" />
            Select a support case from the list.
          </div>
        )}
      </div>

      {/* COLUMN 3: AI Insights Panel (Width: 25%) */}
      <div className={`w-full md:w-72 border-l border-slate-200 flex flex-col h-full bg-slate-50/50 ${mobileActiveView === 'copilot' ? 'flex' : 'hidden md:flex'}`}>
        <div className="p-4 border-b border-slate-200 bg-white shrink-0 flex items-center gap-2 text-slate-800 font-bold text-sm">
          <button
            onClick={() => setMobileActiveView('chat')}
            className="md:hidden p-1.5 -ml-1 mr-1 text-slate-500 hover:text-slate-800 transition-colors"
            title="Quay lại chat"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <BrainCircuit className="w-4.5 h-4.5 text-amber-500" />
          AI Operations Copilot
        </div>

        {activeTicket && (
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Confidence metric */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span className="uppercase">Copilot Analysis</span>
                {analyzing && <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />}
              </div>

              {/* Confidence Score */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-500 mb-1 font-semibold">
                  <span>Confidence Level</span>
                  <span>{aiAnalysis?.confidenceScore || activeTicket.confidenceScore}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${aiAnalysis?.confidenceScore || activeTicket.confidenceScore}%` }}
                  ></div>
                </div>
              </div>

              {/* Sentiment Tracker */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-[11px] text-slate-500 font-semibold uppercase">Mood / Sentiment</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  (aiAnalysis?.sentiment || activeTicket.sentiment) === 'negative' 
                    ? 'bg-rose-100 text-rose-800' 
                    : (aiAnalysis?.sentiment || activeTicket.sentiment) === 'positive'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {sentimentEmoji(aiAnalysis?.sentiment || activeTicket.sentiment)} {aiAnalysis?.sentiment || activeTicket.sentiment}
                </span>
              </div>
            </div>

            {/* Conversation Intent Summary */}
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Intent Detection</span>
              <div className="bg-slate-800 text-slate-100 p-3 rounded-lg font-mono text-xs font-bold flex items-center justify-between border border-slate-700 shadow-sm">
                <span className="text-amber-400">{aiAnalysis?.intent || activeTicket.intent || 'Analyzing...'}</span>
                <Activity className="w-3.5 h-3.5 text-slate-500" />
              </div>
            </div>

            {/* Case Summary */}
            {aiAnalysis?.summary && (
              <div className="space-y-1.5">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Auto-Summary</span>
                <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                  {aiAnalysis.summary}
                </p>
              </div>
            )}

            {/* Recommended Action steps */}
            <div className="space-y-2.5">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Suggested Actions</span>
              <div className="space-y-1.5">
                {aiAnalysis?.recommendedActions?.map((act, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
                    <CornerDownRight className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <span>{act}</span>
                  </div>
                ))}
                {(!aiAnalysis?.recommendedActions || aiAnalysis.recommendedActions.length === 0) && (
                  <div className="text-xs text-slate-400 italic">No recommendations calculated yet.</div>
                )}
              </div>
            </div>

            {/* Internal notes and Escalation */}
            <div className="border-t border-slate-200 pt-4 space-y-3 shrink-0">
              {/* Mobile AI Toggle Assist button so it's fully accessible here too */}
              <button
                onClick={toggleAutoReply}
                className={`w-full py-2 border rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs ${
                  activeTicket.assignedToAI
                    ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <BrainCircuit className="w-3.5 h-3.5 text-amber-500" />
                {activeTicket.assignedToAI ? 'Hủy kích hoạt AI Trả lời' : 'Kích hoạt AI Trả lời'}
              </button>

              <button
                onClick={handleEscalate}
                className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-xs"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                Escalate / Human Takeover
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


