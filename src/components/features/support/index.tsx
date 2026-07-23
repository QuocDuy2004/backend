import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Send, Sparkles,
  CornerDownRight, Clock,
  ChevronLeft, Plus, ShoppingBag, Trash2
} from 'lucide-react';
import { settingsApi, supportApi } from '../../../lib/api';
import { SupportTicket, SupportMessage } from '../../../types';

interface SupportCenterProps {
  tickets: SupportTicket[];
  onUpdateTicket: (updatedTicket: SupportTicket) => void;
  onReplaceTickets?: (tickets: SupportTicket[]) => void;
  products: any[];
}

export function SupportCenter({ tickets, onUpdateTicket, onReplaceTickets, products }: SupportCenterProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string>(tickets[0]?.id || '');
  const [draft, setDraft] = useState('');
  
  const [mobileActiveView, setMobileActiveView] = useState<'list' | 'chat'>('list');
  const [aiReplyStatus, setAiReplyStatus] = useState<'active' | 'inactive'>('active');
  const [aiSettingValue, setAiSettingValue] = useState<Record<string, unknown>>({});

  const activeTicket = tickets.find(t => t.id === selectedTicketId) || tickets[0];
  const getMessageSortTime = (message: SupportMessage) => {
    const timestampTime = new Date(message.timestamp).getTime();
    if (Number.isFinite(timestampTime)) return timestampTime;
    const idTime = String(message.id).match(/\d{10,}/)?.[0];
    return idTime ? Number(idTime) : 0;
  };
  const senderSortWeight = (sender: SupportMessage['sender']) => {
    if (sender === 'customer') return 0;
    if (sender === 'ai') return 1;
    return 2;
  };
  const activeMessages = activeTicket?.messages
    ? [...activeTicket.messages].sort((a, b) => {
        const timeDiff = getMessageSortTime(a) - getMessageSortTime(b);
        if (timeDiff !== 0) return timeDiff;

        const idDiff = (Number(String(a.id).match(/\d{10,}/)?.[0] || 0) - Number(String(b.id).match(/\d{10,}/)?.[0] || 0));
        if (idDiff !== 0) return idDiff;

        return senderSortWeight(a.sender) - senderSortWeight(b.sender);
      })
    : [];
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const syncAiReplyStatus = async () => {
      const data = await settingsApi.list(true);
      if (cancelled) return;
      const setting = (data.settings || []).find((item: any) => (item.settingKey || item.key) === 'ai_customer_support');
      const value = setting?.value && typeof setting.value === 'object' ? setting.value as Record<string, unknown> : {};
      setAiSettingValue(value);
      setAiReplyStatus(setting?.status === 'inactive' || value.enabled === false ? 'inactive' : 'active');
    };

    const syncTicketsFromDatabase = async () => {
      try {
        const data = await supportApi.listTickets();
        if (cancelled) return;

        if (Array.isArray(data.tickets) && data.tickets.length > 0) {
          onReplaceTickets?.(data.tickets as SupportTicket[]);
          setSelectedTicketId((current) => current && data.tickets.some((ticket: SupportTicket) => ticket.id === current) ? current : data.tickets[0].id);
          return;
        }

        onReplaceTickets?.([]);
        setSelectedTicketId('');
      } catch (err) {
        console.warn('Support database sync failed:', err);
      }
    };

    void syncAiReplyStatus().catch((err) => console.warn('AI reply setting sync failed:', err));
    void syncTicketsFromDatabase();
    const timer = window.setInterval(() => {
      void syncTicketsFromDatabase();
    }, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const toggleAiReplyStatus = async () => {
    const nextStatus = aiReplyStatus === 'active' ? 'inactive' : 'active';
    const nextValue = { ...aiSettingValue, enabled: nextStatus === 'active', status: nextStatus };
    setAiReplyStatus(nextStatus);
    setAiSettingValue(nextValue);
    try {
      const data = await settingsApi.save('ai_customer_support', {
        settingGroup: 'ai',
        title: 'Cau hinh CSKH bang AI',
        value: nextValue,
        status: nextStatus,
      });
      const savedValue = data.setting?.value && typeof data.setting.value === 'object' ? data.setting.value as Record<string, unknown> : nextValue;
      setAiSettingValue(savedValue);
      setAiReplyStatus(data.setting?.status === 'inactive' || savedValue.enabled === false ? 'inactive' : 'active');
    } catch (err) {
      setAiReplyStatus(aiReplyStatus);
      setAiSettingValue(aiSettingValue);
      console.warn('Failed to update AI reply status:', err);
    }
  };

  useEffect(() => {
    if (tickets.length === 0) {
      setSelectedTicketId('');
      return;
    }

    if (!tickets.some(ticket => ticket.id === selectedTicketId)) {
      setSelectedTicketId(tickets[0].id);
    }
  }, [tickets, selectedTicketId]);

  // Auto scroll to chat end
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, selectedTicketId]);

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
    void supportApi.saveTicket(activeTicket as unknown as Record<string, unknown>)
      .then(() => supportApi.addMessage(activeTicket.id, newMessage as unknown as Record<string, unknown>))
      .then((data) => {
        if (data.ticket) onUpdateTicket(data.ticket as SupportTicket);
      })
      .catch((err) => console.warn('Failed to save support message:', err));
    setDraft('');

  };

  const handleSolveTicket = () => {
    if (!activeTicket) return;
    const updated: SupportTicket = {
      ...activeTicket,
      status: 'solved'
    };
    onUpdateTicket(updated);
    void supportApi.updateTicket(updated.id, updated as unknown as Record<string, unknown>).catch((err) => {
      console.warn('Failed to save support ticket status:', err);
    });
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

  const normalizeMessageText = (value: string) =>
    value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const formatCurrency = (value: unknown) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
  const getSuggestionPrice = (product?: Record<string, unknown>) => {
    const item = (product || {}) as Record<string, unknown>;
    return item.flashSalePrice || item.discountPrice || item.price || item.originalPrice || 0;
  };

  const getMessageActions = (message: SupportMessage) => {
    const actions = message.metadata?.actions || [];
    if (actions.length > 0) return actions;
    const normalized = normalizeMessageText(message.text);
    if (message.sender === 'ai' && normalized.includes('gio hang')) {
      return [{ id: `${message.id}-cart`, label: 'Mở giỏ hàng', type: 'cart' }];
    }
    return [];
  };

  const getMessageSuggestions = (message: SupportMessage) => {
    const suggestions = message.metadata?.suggestions || [];
    if (suggestions.length > 0) return suggestions;

    const normalized = normalizeMessageText(message.text);
    return products
      .filter((product) => normalized.includes(normalizeMessageText(product.name || '')))
      .slice(0, 3)
      .map((product) => ({
        id: product.id,
        title: product.name,
        subtitle: product.brand,
        product: {
          id: product.id,
          name: product.name,
          brand: product.brand,
          image: product.image || product.images?.[0],
          images: product.images,
          originalPrice: product.originalPrice,
          discountPrice: product.discountPrice,
          flashSalePrice: product.flashSalePrice,
          price: product.price,
          stock: product.stock || product.inventory,
          inventory: product.inventory,
          soldCount: product.soldCount || product.sold || product.sales,
          sold: product.sold,
          rating: product.rating,
        },
      }));
  };

  const actionIcon = (type: string) => {
    if (type.includes('cart') && type.includes('remove')) return <Trash2 className="w-3.5 h-3.5" />;
    if (type.includes('cart') && type.includes('add')) return <Plus className="w-3.5 h-3.5" />;
    if (type.includes('cart')) return <ShoppingBag className="w-3.5 h-3.5" />;
    return <CornerDownRight className="w-3.5 h-3.5" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent p-5 rounded-2xl border border-blue-100/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-extrabold text-slate-900">Tin Nhắn Khách Hàng</h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">Theo dõi hội thoại hỗ trợ, phản hồi khách hàng và lưu lịch sử trao đổi từ ChatBox.</p>
        </div>
      </div>

      <div className="h-[calc(100vh-260px)] min-h-[560px] flex bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* COLUMN 1: Conversation List (Width: 30%) */}
      <div className={`w-full md:w-80 border-r border-slate-200 flex flex-col h-full bg-slate-50/50 ${mobileActiveView === 'list' ? 'flex' : 'hidden md:flex'}`}>
        <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-4.5 h-4.5 text-blue-600" />
            Các cuộc trò chuyện
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
                <button
                  onClick={toggleAiReplyStatus}
                  className={`hidden md:flex px-3 py-1.5 rounded-lg text-xs font-semibold items-center gap-1.5 border transition-all ${
                    aiReplyStatus === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                  title={aiReplyStatus === 'active' ? 'Tắt AI trả lời tự động' : 'Bật AI trả lời tự động'}
                >
                  AI trả lời: {aiReplyStatus === 'active' ? 'Bật' : 'Tắt'}
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
              {activeMessages.map((m, i) => {
                const isCustomer = m.sender === 'customer';
                const isAI = m.sender === 'ai';
                const isOutgoing = !isCustomer;
                const actions = getMessageActions(m);
                const suggestions = getMessageSuggestions(m);
                return (
                  <div key={i} className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[75%] flex flex-col gap-1">
                      <div className={`flex items-center gap-1.5 px-1 ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                        {isCustomer ? (
                          <span className="text-[10px] font-bold text-orange-600 uppercase">Khách hàng</span>
                        ) : isAI ? (
                          <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-slate-400" />
                            Trợ lý
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-blue-600 uppercase">Admin</span>
                        )}
                        <span className="text-[9px] text-slate-400 font-mono">
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isCustomer
                          ? 'bg-white text-slate-800 rounded-tl-sm border border-slate-200/80 shadow-xs'
                          : isAI
                          ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-tr-sm shadow-sm'
                          : 'bg-blue-600 text-white rounded-tr-sm shadow-sm'
                      }`}>
                        {m.text}
                      </div>

                      {(actions.length > 0 || suggestions.length > 0) && (
                        <div className={`mt-2 flex flex-col gap-2 ${isOutgoing ? 'items-end' : 'items-start'}`}>
                          {actions.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {actions.map((action) => (
                                <span
                                  key={action.id}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-3 py-1.5 text-[11px] font-black text-white shadow-sm"
                                >
                                  {actionIcon(action.type)}
                                  {action.label}
                                </span>
                              ))}
                            </div>
                          )}

                          {suggestions.map((suggestion) => {
                            const product = suggestion.product || {};
                            const productImage = product.image || product.images?.[0];
                            return (
                              <div
                                key={suggestion.id}
                                className="w-[280px] rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
                              >
                                <div className="flex gap-3">
                                  {productImage ? (
                                    <img
                                      src={productImage}
                                      alt={suggestion.title}
                                      className="h-20 w-20 rounded-xl object-cover bg-slate-50"
                                    />
                                  ) : (
                                    <div className="h-20 w-20 rounded-xl bg-slate-100" />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="line-clamp-2 text-xs font-extrabold text-slate-900">
                                      {suggestion.title}
                                    </div>
                                    <div className="mt-1 text-[11px] font-semibold text-slate-500">
                                      Mã: {product.id || suggestion.id}
                                    </div>
                                    <div className="mt-1 text-xs font-black text-orange-500">
                                      {formatCurrency(getSuggestionPrice(product))}
                                    </div>
                                    <div className="mt-1 text-[10px] text-slate-500">
                                      Kho {Number(product.stock || product.inventory || 0)} | Đã bán {Number(product.soldCount || product.sold || 0)} | {Number(product.rating || 0)} sao
                                    </div>
                                    {suggestion.subtitle ? (
                                      <div className="mt-1 line-clamp-1 text-[10px] text-slate-400">
                                        {suggestion.subtitle}
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

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

      </div>
    </div>
  );
}

export default SupportCenter;
