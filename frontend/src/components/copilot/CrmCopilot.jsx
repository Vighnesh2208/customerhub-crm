import React, { useState, useRef, useEffect } from 'react';
import { useCrm } from '../../context/CrmContext';
import { processCopilotQuery } from './copilotAgent';
import {
  Bot,
  Sparkles,
  Send,
  X,
  RotateCcw,
  ArrowRight
} from 'lucide-react';

const QUICK_PROMPTS = [
  'Which orders need attention?',
  'Who are my best customers?',
  'What should I focus on today?',
];

let messageCounter = 0;
function createMessageId(prefix) {
  messageCounter += 1;
  return `${prefix}-${Date.now()}-${messageCounter}`;
}

function getFormattedTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function CrmCopilot() {
  const {
    customers,
    orders,
    followUpTasks,
    openCustomerModal,
    openOrderModal,
    setActiveView,
  } = useCrm();

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: `👋 **Welcome to CustomerHub Copilot!**\n\nI am your deterministic **CRM Assistant** connected to your customer directory, orders, and follow-up retention queues.\n\nClick a suggestion below or type your question:`,
      timestamp: 'Just now',
      toolUsed: 'system_welcome',
    },
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isTyping) return;

    const userMessage = {
      id: createMessageId('user'),
      sender: 'user',
      text: query,
      timestamp: getFormattedTime(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await processCopilotQuery({
        query,
        customers,
        orders,
        followUpTasks,
        actions: {
          openCustomerModal,
          openOrderModal,
          setActiveView,
        },
      });

      const assistantMessage = {
        id: createMessageId('assistant'),
        sender: 'assistant',
        text: response.text,
        timestamp: getFormattedTime(),
        toolUsed: response.toolUsed,
        actions: response.actions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId('assistant-err'),
          sender: 'assistant',
          text: `⚠️ An error occurred while analyzing CRM records: ${err.message || 'Unknown error'}. Please try again.`,
          timestamp: getFormattedTime(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: createMessageId('welcome'),
        sender: 'assistant',
        text: `👋 **CustomerHub Copilot reset.**\n\nHow can I help you inspect orders, customer records, or retention priorities?`,
        timestamp: getFormattedTime(),
        toolUsed: 'system_welcome',
      },
    ]);
  };

  // Simple text renderer with basic markdown support (bold, italics, bullets)
  const renderFormattedText = (rawText) => {
    const lines = rawText.split('\n');
    return lines.map((line, lIdx) => {
      if (!line.trim()) {
        return <div key={lIdx} className="h-1.5" />;
      }

      // Format bold and italics
      const parts = line.split(/(\*\*.*?\*\*|\*.*?\*|_.*?_)/g);
      const renderedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
          return <em key={pIdx} className="italic text-slate-600">{part.slice(1, -1)}</em>;
        }
        return part;
      });

      return (
        <p key={lIdx} className="leading-relaxed">
          {renderedParts}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        {!isOpen ? (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group hover:scale-102"
            title="Open CustomerHub Copilot"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
            </div>
            <span className="text-xs font-bold tracking-tight">CustomerHub Copilot</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </button>
        ) : null}
      </div>

      {/* Floating Chat Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="CustomerHub Copilot"
          className="fixed bottom-6 right-6 z-50 w-full sm:w-[410px] h-[560px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-white tracking-tight leading-none">
                    CustomerHub Copilot
                  </h3>
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/20">
                    CRM Assistant
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Tool-based agent • AI-ready
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChat}
                className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                title="Reset conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick suggestions header pills */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200/80 flex items-center gap-1.5 overflow-x-auto shrink-0 select-none no-scrollbar">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                disabled={isTyping}
                className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200/90 rounded-full hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 whitespace-nowrap transition-colors cursor-pointer shadow-2xs shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Message Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/40 text-xs">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 shadow-2xs ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-xs'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
                    }`}
                  >
                    <div className="space-y-1">
                      {renderFormattedText(msg.text)}
                    </div>

                    {/* Interactive Action Buttons */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                        {msg.actions.map((act, actIdx) => (
                          <button
                            key={actIdx}
                            type="button"
                            onClick={() => {
                              if (act.prompt) {
                                handleSendMessage(act.prompt);
                              } else if (act.onClick) {
                                act.onClick();
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors cursor-pointer"
                          >
                            <span>{act.label}</span>
                            <ArrowRight className="w-3 h-3 text-indigo-500" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Timestamp & Tool */}
                  <div className="flex items-center gap-1.5 px-1 text-[10px] text-slate-400">
                    <span>{msg.timestamp}</span>
                    {msg.toolUsed && !isUser && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
                          {msg.toolUsed}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start gap-2 text-xs">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-slate-200/90 rounded-2xl rounded-bl-xs px-3.5 py-2 shadow-2xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-[11px] text-slate-400 ml-1 font-medium">Analyzing CRM data...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-200/90 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about orders, customers, or tasks..."
                disabled={isTyping}
                className="flex-1 px-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
                title="Send message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-slate-400">
              <span>Press <kbd className="font-mono bg-slate-100 px-1 py-0.2 rounded border border-slate-200 text-slate-500">Enter</kbd> to send</span>
              <span>Read-only agent</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
