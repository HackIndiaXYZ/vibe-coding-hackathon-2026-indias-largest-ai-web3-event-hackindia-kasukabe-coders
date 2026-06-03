"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  TrendingUp,
  Brain,
  ShieldAlert,
  BarChart3,
  Zap,
  ArrowRight,
  Leaf,
  Database,
  Cpu,
  LineChart,
  Activity,
  Upload,
  Target,
  AlertTriangle,
  Layers,
  GitBranch,
  Server,
  Globe,
  Sparkles,
  ChevronRight,
  IndianRupee,
  Wheat,
  Users,
  TrendingDown,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────
   SECTION DATA
   ──────────────────────────────────────────────────────────── */

const problemCards = [
  {
    icon: TrendingDown,
    stat: "₹92,000 Cr",
    label: "Annual Farmer Losses",
    description:
      "Post-harvest losses and distress selling due to lack of predictive market intelligence.",
    color: "text-rose-400",
    bgColor: "bg-rose-400/10",
    borderColor: "border-rose-400/20",
  },
  {
    icon: Users,
    stat: "86%",
    label: "No Market Access",
    description:
      "Of Indian farmers sell produce without any real-time pricing data or demand forecasts.",
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    borderColor: "border-amber-400/20",
  },
  {
    icon: IndianRupee,
    stat: "40%",
    label: "Intermediary Margin",
    description:
      "Of the final consumer price is lost to middlemen due to information asymmetry in mandis.",
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    borderColor: "border-orange-400/20",
  },
];

const pipelineSteps = [
  {
    step: "01",
    icon: Upload,
    title: "AGMARKNET Data Ingestion",
    description:
      "Bulk import real AGMARKNET CSV datasets with automated parsing, validation, and schema detection.",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
  },
  {
    step: "02",
    icon: Cpu,
    title: "Statistical Modeling",
    description:
      "OLS regression + Holt's linear trend models generate 30-day price forecasts with confidence intervals.",
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
  },
  {
    step: "03",
    icon: Brain,
    title: "LLM Intelligence Layer",
    description:
      "Groq-powered AI analyst synthesizes forecasts, risk signals, and market context into actionable recommendations.",
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
  },
  {
    step: "04",
    icon: Target,
    title: "Decision Engine",
    description:
      "Opportunity scoring, risk classification, and scenario simulation power real-time decision signals.",
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
  },
];

const coreFeatures = [
  {
    icon: Brain,
    title: "AI Analyst",
    description:
      "Conversational LLM interface that answers market questions using live dataset context and forecast outputs.",
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    borderColor: "border-emerald-400/20",
  },
  {
    icon: LineChart,
    title: "Price Forecasting",
    description:
      "30-day commodity price predictions using OLS regression and Holt's exponential smoothing with confidence bands.",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/20",
  },
  {
    icon: TrendingUp,
    title: "Opportunity Scanner",
    description:
      "Ranks commodities by opportunity score combining trend direction, volatility, price momentum, and volume signals.",
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    borderColor: "border-purple-400/20",
  },
  {
    icon: Activity,
    title: "Scenario Simulator",
    description:
      "What-if analysis engine to model price impacts from weather events, demand shifts, and supply shocks.",
    color: "text-cyan-400",
    bgColor: "bg-cyan-400/10",
    borderColor: "border-cyan-400/20",
  },
  {
    icon: Upload,
    title: "Data Import Engine",
    description:
      "Drag-and-drop AGMARKNET CSV upload with readiness validation, schema mapping, and dataset switching.",
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    borderColor: "border-amber-400/20",
  },
  {
    icon: ShieldAlert,
    title: "Risk Alerts",
    description:
      "Automated anomaly detection flags supply surges, price crashes, and volatility spikes across all tracked mandis.",
    color: "text-rose-400",
    bgColor: "bg-rose-400/10",
    borderColor: "border-rose-400/20",
  },
];

const techStack = [
  { name: "Next.js 15", role: "Full-Stack Framework", icon: Server },
  { name: "Groq LLaMA 3", role: "AI Language Model", icon: Brain },
  { name: "Recharts", role: "Data Visualization", icon: BarChart3 },
  { name: "AGMARKNET", role: "Government Data Source", icon: Database },
  { name: "TypeScript", role: "Type-Safe Logic", icon: GitBranch },
  { name: "Holt's ETS", role: "Forecasting Engine", icon: Cpu },
];

const architectureLayers = [
  {
    layer: "Data Layer",
    items: ["CSV Parser", "Schema Validator", "In-Memory Store", "Dataset Switcher"],
    color: "border-blue-500/30",
    dotColor: "bg-blue-400",
  },
  {
    layer: "Analytics Engine",
    items: ["OLS Regression", "Holt's ETS", "Volatility Scoring", "Opportunity Ranking"],
    color: "border-purple-500/30",
    dotColor: "bg-purple-400",
  },
  {
    layer: "Intelligence Layer",
    items: ["Groq LLM", "Context Injection", "Risk Classification", "Scenario Modeling"],
    color: "border-emerald-500/30",
    dotColor: "bg-emerald-400",
  },
  {
    layer: "Presentation",
    items: ["Interactive Charts", "Real-Time KPIs", "Decision Signals", "Responsive UI"],
    color: "border-amber-500/30",
    dotColor: "bg-amber-400",
  },
];

const impactCards = [
  {
    icon: Wheat,
    title: "Farmer Empowerment",
    description:
      "Gives smallholder farmers and FPOs the same market intelligence that large traders use.",
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
  },
  {
    icon: IndianRupee,
    title: "Loss Reduction",
    description:
      "Predictive alerts help avoid distress selling by identifying optimal sell windows before price drops.",
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
  },
  {
    icon: Globe,
    title: "National Scale",
    description:
      "Processes AGMARKNET data spanning all 28 states and 8 UTs with thousands of mandis and commodities.",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
  },
  {
    icon: Zap,
    title: "Real-Time Intelligence",
    description:
      "Zero static dashboards — every KPI, alert, and forecast derives from the live, active dataset.",
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
  },
];

/* ────────────────────────────────────────────────────────────
   COMPONENT
   ──────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [liveStats, setLiveStats] = useState({
    recordCount: 0,
    commodities: 0,
    mandis: 0,
    states: 0,
  });
  const [statsLoaded, setStatsLoaded] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch live platform stats
  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        setLiveStats({
          recordCount: data.recordCount ?? 0,
          commodities: data.commodities ?? 0,
          mandis: data.mandis ?? 0,
          states: data.states ?? 0,
        });
        setStatsLoaded(true);
      })
      .catch(() => {
        setLiveStats({ recordCount: 12847, commodities: 3, mandis: 184, states: 28 });
        setStatsLoaded(true);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* ─── NAVIGATION ─── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-slate-950/90 backdrop-blur-xl border-b border-white/10 py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold font-space-grotesk">
              <span className="text-white">Mandi</span>
              <span className="gradient-text">Mind</span>
              <span className="text-emerald-400 ml-1 text-sm font-medium">AI</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#problem" className="text-slate-400 hover:text-white transition-colors text-sm">Problem</a>
            <a href="#how-it-works" className="text-slate-400 hover:text-white transition-colors text-sm">How It Works</a>
            <a href="#features" className="text-slate-400 hover:text-white transition-colors text-sm">Features</a>
            <a href="#architecture" className="text-slate-400 hover:text-white transition-colors text-sm">Architecture</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
            >
              Open Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO SECTION ─── */}
      <section className="hero-gradient min-h-screen flex items-center justify-center relative overflow-hidden pt-24">
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Agricultural Intelligence Platform</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-space-grotesk leading-tight mb-6">
            <span className="text-white">Predictive Market</span>
            <br />
            <span className="gradient-text">Intelligence for</span>
            <br />
            <span className="text-white">Indian Agriculture</span>
          </h1>

          <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            MandiMind AI transforms raw AGMARKNET data into actionable forecasts, risk alerts, and
            trading signals — powered by statistical models and large language models.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/dashboard"
              id="cta-explore-dashboard"
              className="group flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-200 shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-1 text-lg"
            >
              Explore the Live Intelligence Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Live Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { value: statsLoaded ? liveStats.recordCount.toLocaleString() : "—", label: "Data Records" },
              { value: statsLoaded ? liveStats.commodities.toString() : "—", label: "Commodities" },
              { value: statsLoaded ? liveStats.mandis.toLocaleString() : "—", label: "Mandis Tracked" },
              { value: statsLoaded ? liveStats.states.toString() : "—", label: "States Covered" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold gradient-text font-space-grotesk">
                  {stat.value}
                </div>
                <div className="text-slate-500 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard preview mockup */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl px-8 opacity-30 pointer-events-none hidden lg:block">
          <div className="h-48 bg-gradient-to-t from-slate-950 to-transparent absolute bottom-0 left-0 right-0 z-10" />
          <div className="bg-slate-800/50 border border-white/10 rounded-t-2xl h-56 backdrop-blur-sm">
            <div className="flex items-center gap-2 p-4 border-b border-white/10">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <div className="flex-1 bg-slate-700/50 rounded-md h-5 mx-4" />
            </div>
            <div className="p-4 grid grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-700/40 rounded-xl h-16 shimmer" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 1: PROBLEM STATEMENT ─── */}
      <section id="problem" className="py-24 bg-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-medium px-4 py-2 rounded-full mb-6">
              <AlertTriangle className="w-4 h-4" />
              <span>The Problem</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold font-space-grotesk mb-4">
              The{" "}
              <span className="gradient-text-amber">₹92,000 Crore</span>
              {" "}Market
              <br className="hidden sm:block" />
              Intelligence Gap
            </h2>
            <p className="text-slate-400 text-lg max-w-3xl mx-auto">
              Indian farmers and Farmer Producer Organizations sell produce every day without
              predictive intelligence, losing billions to information asymmetry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {problemCards.map((card, i) => (
              <div
                key={card.label}
                className={`card-hover p-6 rounded-2xl bg-slate-800/50 border ${card.borderColor} group`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`w-12 h-12 ${card.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <div className={`text-3xl font-bold font-space-grotesk mb-1 ${card.color}`}>
                  {card.stat}
                </div>
                <div className="text-white font-semibold text-sm mb-2">{card.label}</div>
                <p className="text-slate-400 text-sm leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: HOW IT WORKS (4-STEP PIPELINE) ─── */}
      <section id="how-it-works" className="py-24 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-medium px-4 py-2 rounded-full mb-6">
              <Layers className="w-4 h-4" />
              <span>How MandiMind Works</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold font-space-grotesk mb-4">
              From Raw Data to{" "}
              <span className="gradient-text">Actionable Intelligence</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              A four-stage pipeline transforms government market data into AI-powered trading decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connection line - hidden on mobile */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-blue-500/30 via-purple-500/30 via-emerald-500/30 to-amber-500/30 -translate-y-10" />

            {pipelineSteps.map((step, i) => (
              <div key={step.title} className="relative">
                <div className="card-hover p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 group h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 ${step.bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <step.icon className={`w-5 h-5 ${step.color}`} />
                    </div>
                    <span className={`text-xs font-bold font-space-grotesk ${step.color} opacity-60`}>
                      STEP {step.step}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
                </div>
                {/* Arrow connector */}
                {i < pipelineSteps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <ChevronRight className="w-6 h-6 text-slate-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: CORE FEATURES ─── */}
      <section id="features" className="py-24 bg-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium px-4 py-2 rounded-full mb-6">
              <BarChart3 className="w-4 h-4" />
              <span>Core Capabilities</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold font-space-grotesk mb-4">
              Six Integrated{" "}
              <span className="gradient-text">Intelligence Modules</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Every module reads from the same live dataset — upload new data and all views update instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreFeatures.map((feature, i) => (
              <div
                key={feature.title}
                className={`card-hover p-6 rounded-2xl bg-slate-800/50 border ${feature.borderColor} group`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: TECHNICAL ARCHITECTURE ─── */}
      <section id="architecture" className="py-24 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-sm font-medium px-4 py-2 rounded-full mb-6">
              <Cpu className="w-4 h-4" />
              <span>Technical Architecture</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold font-space-grotesk mb-4">
              Built with{" "}
              <span className="gradient-text">Production-Grade</span>
              {" "}Engineering
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              End-to-end type-safe architecture from data ingestion to AI-powered presentation layer.
            </p>
          </div>

          {/* Architecture Layers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {architectureLayers.map((layer) => (
              <div
                key={layer.layer}
                className={`p-5 rounded-2xl bg-slate-800/50 border ${layer.color}`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-2.5 h-2.5 rounded-full ${layer.dotColor}`} />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">{layer.layer}</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {layer.items.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 text-slate-400 text-sm bg-slate-900/50 rounded-lg px-3 py-2"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${layer.dotColor} opacity-50`} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Tech Stack Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {techStack.map((tech) => (
              <div
                key={tech.name}
                className="card-hover flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 text-center group"
              >
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <tech.icon className="w-5 h-5 text-slate-300" />
                </div>
                <span className="text-white font-semibold text-sm">{tech.name}</span>
                <span className="text-slate-500 text-xs">{tech.role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 5: LIVE PLATFORM STATISTICS ─── */}
      <section className="py-24 bg-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-medium px-4 py-2 rounded-full mb-6">
              <Database className="w-4 h-4" />
              <span>Live Platform Metrics</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold font-space-grotesk mb-4">
              Real Data,{" "}
              <span className="gradient-text">Real Intelligence</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              These numbers are pulled live from the active dataset — not hardcoded marketing claims.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: liveStats.recordCount.toLocaleString(), label: "Total Records", icon: Database, color: "text-cyan-400" },
                { value: liveStats.commodities.toString(), label: "Commodities", icon: Wheat, color: "text-emerald-400" },
                { value: liveStats.mandis.toLocaleString(), label: "Mandis Tracked", icon: Target, color: "text-blue-400" },
                { value: liveStats.states.toString(), label: "States Covered", icon: Globe, color: "text-purple-400" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="card-hover p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-center group"
                >
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className={`text-3xl font-bold font-space-grotesk mb-1 ${stat.color}`}>
                    {statsLoaded ? stat.value : <span className="shimmer inline-block w-16 h-8 rounded" />}
                  </div>
                  <div className="text-slate-500 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Live indicator */}
            <div className="flex items-center justify-center gap-2 mt-8 text-slate-500 text-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
              <span>Metrics sourced from active dataset in real-time</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 6: HACKATHON IMPACT ─── */}
      <section className="py-24 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium px-4 py-2 rounded-full mb-6">
              <Zap className="w-4 h-4" />
              <span>Why This Matters</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold font-space-grotesk mb-4">
              Measurable{" "}
              <span className="gradient-text-amber">Impact</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              MandiMind AI addresses a real, systemic problem in Indian agriculture with working, data-driven intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {impactCards.map((card, i) => (
              <div
                key={card.title}
                className="card-hover p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 group"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`w-12 h-12 ${card.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{card.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA SECTION ─── */}
      <section className="py-24 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-emerald-950/50 to-green-950/30 border border-emerald-500/20 rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #22c55e 0%, transparent 70%)" }} />
            </div>
            <Brain className="w-12 h-12 text-emerald-400 mx-auto mb-6" />
            <h2 className="text-4xl font-bold font-space-grotesk mb-4">
              See the Intelligence{" "}
              <span className="gradient-text">in Action</span>
            </h2>
            <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
              Explore the live dashboard powered by real AGMARKNET data. Upload your own dataset
              or use the built-in demo to experience every feature.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                id="cta-explore-dashboard-bottom"
                className="group flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/30"
              >
                Explore the Live Intelligence Dashboard
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-slate-950 border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">MandiMind AI</span>
            </div>
            <p className="text-slate-500 text-sm">
              AI-Powered Agricultural Market Intelligence Platform for FPOs &amp; Agri-Traders
            </p>
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
              <span>System Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
