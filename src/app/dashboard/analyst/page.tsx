"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Brain,
  Send,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  MapPin,
  BarChart3,
  User,
  Copy,
  Check,
  RefreshCw,
  ChevronRight,
  Loader2,
  Wheat,
  AlertTriangle,
  AlertCircle,
  Info,
  Zap,
  MessageSquare,
  Target,
  Database,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ShoppingCart,
  PackageCheck,
  Eye,
  DollarSign,
  Activity,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalystResponse } from "@/app/api/analyst/route";

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageRole = "user" | "assistant";

interface Message {
  id: string;
  role: MessageRole;
  content: string; // user text or empty for AI
  structured?: AnalystResponse;
  timestamp: Date;
  isStreaming?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SAMPLE_PROMPTS = [
  {
    icon: TrendingUp,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    text: "Should I sell onions this week?",
    tag: "Trade Decision",
  },
  {
    icon: MapPin,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    text: "Which mandi is best for mustard right now?",
    tag: "Market Finder",
  },
  {
    icon: AlertTriangle,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    text: "Why is tomato price falling so sharply?",
    tag: "Risk Analysis",
  },
  {
    icon: Zap,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    text: "What are the highest opportunity crops right now?",
    tag: "Opportunities",
  },
  {
    icon: BarChart3,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    text: "Give me a supply-demand analysis for garlic.",
    tag: "Deep Analysis",
  },
  {
    icon: ShieldAlert,
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
    text: "Which commodities have the highest risk this week?",
    tag: "Risk Scan",
  },
];

const INITIAL_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "welcome",
  timestamp: new Date(),
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConfidenceGauge({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-emerald-400" :
    score >= 60 ? "text-amber-400" :
    "text-red-400";
  const trackColor =
    score >= 80 ? "bg-emerald-500" :
    score >= 60 ? "bg-amber-500" :
    "bg-red-500";
  const label =
    score >= 80 ? "High Confidence" :
    score >= 60 ? "Moderate Confidence" :
    "Low Confidence";

  // SVG arc calculation
  const r = 36;
  const cx = 44;
  const cy = 44;
  const circumference = Math.PI * r; // half-circle
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-14 flex items-end justify-center">
        <svg width="88" height="52" viewBox="0 0 88 52" className="overflow-visible">
          {/* Track */}
          <path
            d={`M 8 44 A 36 36 0 0 1 80 44`}
            fill="none"
            stroke="rgb(51,65,85)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Progress */}
          <path
            d={`M 8 44 A 36 36 0 0 1 80 44`}
            fill="none"
            stroke={score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444"}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute bottom-0 flex flex-col items-center">
          <span className={cn("text-2xl font-bold font-space-grotesk leading-none", color)}>
            {score}%
          </span>
        </div>
      </div>
      <span className={cn("text-xs font-semibold", color)}>{label}</span>
    </div>
  );
}

function DataPointBadge({ label, value, type }: { label: string; value: string; type: string }) {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    price: DollarSign,
    forecast: TrendingUp,
    volume: BarChart3,
    score: Target,
    change: Activity,
    alert: TriangleAlert,
  };
  const colorMap: Record<string, string> = {
    price: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    forecast: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    volume: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    score: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    change: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    alert: "text-red-400 bg-red-500/10 border-red-500/20",
  };
  const Icon = iconMap[type] || Activity;
  const colorClass = colorMap[type] || colorMap.price;

  return (
    <div className={cn("flex items-start gap-2.5 p-3 rounded-xl border", colorClass)}>
      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mb-0.5">{label}</div>
        <div className="text-sm font-bold leading-tight">{value}</div>
      </div>
    </div>
  );
}

function RiskBadge({ severity, description }: { severity: string; description: string }) {
  const config = {
    high: { icon: AlertTriangle, className: "text-red-400 bg-red-500/10 border-red-500/20", dot: "bg-red-500", label: "HIGH" },
    medium: { icon: AlertCircle, className: "text-amber-400 bg-amber-500/10 border-amber-500/20", dot: "bg-amber-500", label: "MED" },
    low: { icon: Info, className: "text-blue-400 bg-blue-500/10 border-blue-500/20", dot: "bg-blue-500", label: "LOW" },
  }[severity] ?? { icon: Info, className: "text-slate-400 bg-slate-700 border-slate-600", dot: "bg-slate-500", label: "?" };

  const Icon = config.icon;

  return (
    <div className={cn("flex items-start gap-2.5 p-2.5 rounded-lg border text-xs", config.className)}>
      <Icon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <span className="font-bold mr-1.5 text-[10px]">{config.label}:</span>
        <span className="opacity-90 leading-snug">{description}</span>
      </div>
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const config = {
    SELL: { icon: TrendingDown, className: "bg-rose-500/20 border-rose-500/40 text-rose-300", dot: "bg-rose-500" },
    BUY: { icon: ShoppingCart, className: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300", dot: "bg-emerald-500" },
    HOLD: { icon: PackageCheck, className: "bg-amber-500/20 border-amber-500/40 text-amber-300", dot: "bg-amber-500" },
    MONITOR: { icon: Eye, className: "bg-blue-500/20 border-blue-500/40 text-blue-300", dot: "bg-blue-500" },
  }[action] ?? { icon: Eye, className: "bg-slate-700 border-slate-600 text-slate-300", dot: "bg-slate-500" };

  const Icon = config.icon;

  return (
    <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border font-bold text-sm", config.className)}>
      <Icon className="w-4 h-4" />
      {action}
    </div>
  );
}

function SentimentChip({ sentiment }: { sentiment: string }) {
  if (sentiment === "bullish") return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
      <ArrowUpRight className="w-3 h-3" /> BULLISH
    </span>
  );
  if (sentiment === "bearish") return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
      <ArrowDownRight className="w-3 h-3" /> BEARISH
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 border border-slate-600">
      <Minus className="w-3 h-3" /> NEUTRAL
    </span>
  );
}

// ─── Structured Response Card ─────────────────────────────────────────────────

function StructuredResponseCard({
  data,
  onCopy,
}: {
  data: AnalystResponse;
  onCopy: (text: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = [
      `Executive Summary: ${data.executiveSummary}`,
      `Confidence: ${data.confidenceScore}%`,
      `Recommended Action: ${data.recommendedAction.action} — ${data.recommendedAction.headline}`,
      `Detail: ${data.recommendedAction.detail}`,
      `Risk Factors: ${data.riskFactors.map((r) => r.description).join("; ")}`,
    ].join("\n\n");
    onCopy(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const actionBg = {
    SELL: "from-rose-950/40 to-slate-900/60 border-rose-500/25",
    BUY: "from-emerald-950/40 to-slate-900/60 border-emerald-500/25",
    HOLD: "from-amber-950/30 to-slate-900/60 border-amber-500/25",
    MONITOR: "from-blue-950/30 to-slate-900/60 border-blue-500/25",
  }[data.recommendedAction.action] ?? "from-slate-800/80 to-slate-900/60 border-slate-700";

  return (
    <div className="w-full space-y-3 animate-fade-in-up">
      {/* ① Executive Summary */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-slate-700/60 p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Executive Summary
            </span>
          </div>
          <div className="flex items-center gap-2">
            <SentimentChip sentiment={data.sentiment} />
            <button
              onClick={handleCopy}
              className="text-slate-600 hover:text-slate-300 transition-colors p-1 rounded"
              title="Copy full analysis"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed font-medium">{data.executiveSummary}</p>
      </div>

      {/* ② Key Data Points */}
      <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
            <Database className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Key Data Points Used
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {data.keyDataPoints.map((dp, i) => (
            <DataPointBadge key={i} label={dp.label} value={dp.value} type={dp.type} />
          ))}
        </div>
        {/* Data sources */}
        {data.dataSourcesUsed?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-700/40 flex flex-wrap gap-1.5">
            {data.dataSourcesUsed.map((src) => (
              <span key={src} className="text-[10px] text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-full">
                {src}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ③ Confidence Score */}
      <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
            <Target className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            AI Confidence Score
          </span>
        </div>
        <div className="flex items-center gap-6">
          <ConfidenceGauge score={data.confidenceScore} />
          <div className="flex-1">
            <p className="text-xs text-slate-400 leading-relaxed">{data.confidenceRationale}</p>
            <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-1000",
                  data.confidenceScore >= 80 ? "bg-gradient-to-r from-emerald-500 to-green-400" :
                  data.confidenceScore >= 60 ? "bg-gradient-to-r from-amber-500 to-yellow-400" :
                  "bg-gradient-to-r from-red-500 to-orange-400"
                )}
                style={{ width: `${data.confidenceScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ④ Risk Factors */}
      <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/25 flex items-center justify-center">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Risk Factors
          </span>
        </div>
        <div className="space-y-2">
          {data.riskFactors.map((rf, i) => (
            <RiskBadge key={i} severity={rf.severity} description={rf.description} />
          ))}
        </div>
      </div>

      {/* ⑤ Recommended Action */}
      <div className={cn("rounded-2xl bg-gradient-to-br border p-4", actionBg)}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Recommended Action
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <ActionBadge action={data.recommendedAction.action} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white mb-1">{data.recommendedAction.headline}</p>
            <p className="text-xs text-slate-300 leading-relaxed">{data.recommendedAction.detail}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Welcome card ─────────────────────────────────────────────────────────────

function WelcomeCard() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/80 border border-slate-700/50 p-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white mb-2">Welcome to MandiMind AI Analyst 🌾</h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-3">
            Every answer is structured into five analytical sections — Executive Summary, Key Data Points, Confidence Score, Risk Factors, and a clear Recommended Action — all sourced from live market data.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Brain, text: "Price Forecasts (184 commodities)", color: "text-violet-400" },
              { icon: ShieldAlert, text: "Risk Alerts (real-time)", color: "text-red-400" },
              { icon: BarChart3, text: "Historical Trends (6M)", color: "text-blue-400" },
              { icon: Zap, text: "Opportunity Scores", color: "text-amber-400" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-1.5 text-xs text-slate-500">
                <item.icon className={cn("w-3.5 h-3.5", item.color)} />
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Message Bubble (user side) ───────────────────────────────────────────────

function UserBubble({ message }: { message: Message }) {
  return (
    <div className="flex gap-3 flex-row-reverse">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5">
        <User className="w-4 h-4 text-white" />
      </div>
      <div className="flex flex-col items-end max-w-[75%]">
        <div className="bg-gradient-to-br from-blue-600/80 to-violet-700/80 border border-blue-500/30 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed">
          {message.content}
        </div>
        <div className="text-[10px] text-slate-600 mt-1 px-1">
          {message.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}

// ─── AI Message (structured card or loading) ──────────────────────────────────

function AIMessage({
  message,
  onCopy,
}: {
  message: Message;
  onCopy: (text: string) => void;
}) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-emerald-500/20">
        <Brain className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        {message.isStreaming ? (
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl rounded-tl-sm px-4 py-3 inline-flex items-center gap-3">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
            <span className="text-xs text-slate-400">Analyzing market data...</span>
          </div>
        ) : message.id === "welcome" ? (
          <WelcomeCard />
        ) : message.structured ? (
          <StructuredResponseCard data={message.structured} onCopy={onCopy} />
        ) : null}
        {!message.isStreaming && (
          <div className="text-[10px] text-slate-600 mt-1.5 px-1">
            {message.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            <span className="ml-2 text-emerald-700">• MandiMind AI</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalystPage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setError(null);

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      const placeholderId = `ai-${Date.now()}`;
      const streamingMsg: Message = {
        id: placeholderId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, streamingMsg]);
      setInput("");
      setIsLoading(true);

      // Build API history (exclude welcome)
      const history = [...messages, userMsg]
        .filter((m) => m.id !== "welcome" && !m.isStreaming)
        .map((m) => ({ role: m.role, content: m.content }));

      abortRef.current = new AbortController();

      try {
        const res = await fetch("/api/analyst", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
          signal: abortRef.current.signal,
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "API request failed");

        setMessages((prev) =>
          prev.map((m) =>
            m.id === placeholderId
              ? {
                  ...m,
                  content: trimmed,
                  structured: data.structured as AnalystResponse,
                  isStreaming: false,
                  timestamp: new Date(),
                }
              : m
          )
        );
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setMessages((prev) => prev.filter((m) => m.id !== placeholderId));
        setError(err instanceof Error ? err.message : "Failed to get response");
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleReset = () => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([INITIAL_MESSAGE]);
    setInput("");
    setError(null);
    setIsLoading(false);
  };

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-4rem)] max-w-[1200px] mx-auto">
      {/* Page Header */}
      <div className="flex-shrink-0 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white font-space-grotesk">AI Market Analyst</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
                <span className="text-xs text-slate-400">Groq · llama-3.3-70b · Structured Analysis</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium px-3 py-1.5 rounded-lg">
              <Sparkles className="w-3.5 h-3.5" />
              5-Section Analysis
            </div>
            <button
              onClick={handleReset}
              id="analyst-reset"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 border border-slate-700 hover:border-slate-600 px-3 py-1.5 rounded-lg transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:block">New Chat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Layout */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Chat Column */}
        <div className="flex-1 flex flex-col min-w-0 gap-3">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-5 min-h-0">
            {messages.map((message) =>
              message.role === "user" ? (
                <UserBubble key={message.id} message={message} />
              ) : (
                <AIMessage key={message.id} message={message} onCopy={copyToClipboard} />
              )
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-400">Analysis Failed</p>
                  <p className="text-xs text-slate-400 mt-0.5">{error}</p>
                  {error.includes("GROQ_API_KEY") && (
                    <p className="text-xs text-amber-400 mt-2">
                      💡 Add your key to{" "}
                      <code className="bg-slate-700 px-1 rounded">.env.local</code> as{" "}
                      <code className="bg-slate-700 px-1 rounded">GROQ_API_KEY=gsk_...</code> and restart.
                    </p>
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 bg-slate-800/80 border border-slate-700 rounded-2xl p-3 focus-within:border-violet-500/50 transition-colors">
            <textarea
              ref={inputRef}
              id="analyst-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about prices, mandi selection, risks, trade timing..."
              rows={2}
              disabled={isLoading}
              className="w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-600 outline-none resize-none leading-relaxed disabled:opacity-50"
            />
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50">
              <p className="text-[10px] text-slate-600">Enter to send · Shift+Enter for new line</p>
              <button
                id="analyst-send"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "flex items-center gap-2 font-semibold text-sm px-4 py-2 rounded-xl transition-all duration-200",
                  input.trim() && !isLoading
                    ? "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/25 hover:-translate-y-0.5"
                    : "bg-slate-700 text-slate-500 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Analyzing...</>
                ) : (
                  <><Send className="w-4 h-4" />Analyze</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="hidden lg:flex flex-col w-72 gap-3 flex-shrink-0">
          {/* Sample Prompts */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Sample Questions
              </h3>
            </div>
            <div className="space-y-2">
              {SAMPLE_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  id={`sample-prompt-${i}`}
                  onClick={() => sendMessage(prompt.text)}
                  disabled={isLoading}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border text-xs transition-all duration-150 disabled:opacity-40 hover:scale-[1.01] active:scale-[0.99] hover:brightness-110",
                    prompt.bg
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <prompt.icon className={cn("w-3.5 h-3.5 flex-shrink-0", prompt.color)} />
                    <span className={cn("text-[10px] font-bold uppercase tracking-wide", prompt.color)}>
                      {prompt.tag}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-snug">{prompt.text}</p>
                  <ChevronRight className="w-3 h-3 text-slate-600 mt-1 ml-auto" />
                </button>
              ))}
            </div>
          </div>

          {/* Response structure legend */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-3">
              Response Structure
            </h3>
            <div className="space-y-2">
              {[
                { num: "①", label: "Executive Summary", color: "text-violet-400" },
                { num: "②", label: "Key Data Points", color: "text-blue-400" },
                { num: "③", label: "Confidence Score", color: "text-amber-400" },
                { num: "④", label: "Risk Factors", color: "text-red-400" },
                { num: "⑤", label: "Recommended Action", color: "text-emerald-400" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5 text-xs">
                  <span className={cn("font-bold text-sm w-5 flex-shrink-0", item.color)}>{item.num}</span>
                  <span className="text-slate-400">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Data Context */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Wheat className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Live Prices
              </h3>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "Onion", price: "₹2,850/q", forecast: "+17.5%", bullish: true },
                { label: "Tomato", price: "₹1,650/q", forecast: "-33%", bullish: false },
                { label: "Potato", price: "₹980/q", forecast: "+30%", bullish: true },
                { label: "Garlic", price: "₹7,200/q", forecast: "+9%", bullish: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-300 font-medium">{item.label}</span>
                    <span className="text-[10px] text-slate-500 ml-1">{item.price}</span>
                  </div>
                  <span className={cn("text-[10px] font-bold", item.bullish ? "text-emerald-400" : "text-red-400")}>
                    {item.forecast}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-700/50 flex items-center gap-1.5 text-[10px] text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
                Updated 2 min ago
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Prompts */}
      <div className="flex-shrink-0 lg:hidden mt-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {SAMPLE_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => sendMessage(prompt.text)}
              disabled={isLoading}
              className={cn(
                "flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all disabled:opacity-40",
                prompt.bg
              )}
            >
              <prompt.icon className={cn("w-3.5 h-3.5", prompt.color)} />
              <span className="text-slate-300 whitespace-nowrap max-w-[160px] truncate">{prompt.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
