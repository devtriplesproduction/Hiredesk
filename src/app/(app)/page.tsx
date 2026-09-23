"use client";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { ScoreBadge, StatusBadge, EmploymentBadge, Btn } from "@/components/ui";
import { useRouter } from "next/navigation";
import CandidateDetail from "@/components/candidates/CandidateDetail";
import type { Candidate } from "@/types";
import { getEmploymentStatusMeta } from "@/lib/data";
import { clsx } from "clsx";
import {
  Users,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  TrendingUp,
  Briefcase,
  Code2,
  Palette,
  Target,
  BarChart3,
  Layers,
  ArrowUpRight,
  Plus,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Building2,
  Activity,
  FileText,
  Calendar,
} from "lucide-react";

export default function DashboardPage() {
  const { candidates, roles, setFilters, employees, interviews, offers } = useStore();
  const router = useRouter();
  const [inspectCandidate, setInspectCandidate] = useState<Candidate | null>(null);
  const [showFunnel, setShowFunnel] = useState(false);
  const [showQuality, setShowQuality] = useState(false);

  const total = candidates.length;

  const interviewStats = useMemo(() => {
    const totalCount = interviews.length;
    const r1 = interviews.filter(i => i.round === 1).length;
    const r2 = interviews.filter(i => i.round === 2).length;
    return { total: totalCount, r1, r2 };
  }, [interviews]);

  const offersStats = useMemo(() => {
    const totalCount = offers.length;
    const accepted = offers.filter(o => o.status === "accepted").length;
    const sent = offers.filter(o => o.status === "sent").length;
    const draft = offers.filter(o => !o.status || o.status === "draft").length;
    return { total: totalCount, accepted, sent, draft };
  }, [offers]);

  const { hired, inReview, newCount, rejected, avgScore, shortlisted, offerAccepted } = useMemo(() => {
    const hiredCount = employees.length > 0 ? employees.length : candidates.filter(c => c.status === "hired").length;
    const offAcc = candidates.filter(c => c.status === "offer_accepted" || c.status === "approved").length;
    const rev = candidates.filter(c => c.status === "review" || c.status === "onboarding_review" || (c.status as string) === "in_review").length;
    const n = candidates.filter(c => c.status === "new").length;
    const rej = candidates.filter(c => c.status === "rejected" || c.status === "offer_rejected" || c.status === "onboarding_rejected").length;
    const short = candidates.filter(c => ["shortlisted", "interview_1", "interview_2", "offer", "offer_sent"].includes(c.status)).length;
    const avg = total > 0 ? Math.round(candidates.reduce((a, c) => a + (c.score?.total || 0), 0) / total) : 0;
    return { hired: hiredCount, inReview: rev, newCount: n, rejected: rej, avgScore: avg, shortlisted: short, offerAccepted: offAcc };
  }, [candidates, employees, total]);

  const topCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => (b.score?.total || 0) - (a.score?.total || 0)).slice(0, 5);
  }, [candidates]);

  const roleBreakdown = useMemo(() => {
    return roles
      .map(r => {
        const roleCandidates = candidates.filter(
          c => c.roleId === r.id || c.roleName?.toLowerCase() === r.name?.toLowerCase()
        );
        const count = roleCandidates.length;
        const rAvgScore = count > 0
          ? Math.round(roleCandidates.reduce((a, c) => a + (c.score?.total || 0), 0) / count)
          : 0;
        return {
          ...r,
          count,
          avgScore: rAvgScore,
        };
      })
      .filter(r => r.count > 0 || r.isActive)
      .sort((a, b) => b.count - a.count);
  }, [roles, candidates]);

  const topDemandedRole = useMemo(() => {
    return roleBreakdown.length > 0 && roleBreakdown[0].count > 0 ? roleBreakdown[0] : null;
  }, [roleBreakdown]);

  const highestScoringRole = useMemo(() => {
    const rolesWithCandidates = roleBreakdown.filter(r => r.count > 0);
    if (rolesWithCandidates.length === 0) return null;
    return [...rolesWithCandidates].sort((a, b) => b.avgScore - a.avgScore)[0];
  }, [roleBreakdown]);

  const recentCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 6);
  }, [candidates]);

  // Score distribution bands
  const scoreBands = useMemo(() => {
    const exceptional = candidates.filter(c => (c.score?.total || 0) >= 80).length;
    const strong = candidates.filter(c => (c.score?.total || 0) >= 65 && (c.score?.total || 0) < 80).length;
    const moderate = candidates.filter(c => (c.score?.total || 0) >= 45 && (c.score?.total || 0) < 65).length;
    const low = candidates.filter(c => (c.score?.total || 0) < 45).length;
    return { exceptional, strong, moderate, low };
  }, [candidates]);

  function goFiltered(status: string) {
    if (status === "hired") {
      router.push("/employees");
      return;
    }
    setFilters({ search: "", roleId: "all", status, city: "", gender: "all", ageRange: "all", exp: "all", sort: "newest" });
    router.push("/candidates");
  }

  function goRoleFiltered(roleId: string) {
    setFilters({ search: "", roleId, status: "all", city: "", gender: "all", ageRange: "all", exp: "all", sort: "newest" });
    router.push("/candidates");
  }

  function getRoleVisual(roleName: string, index: number) {
    const lower = (roleName || "").toLowerCase();
    if (lower.includes("dev") || lower.includes("web") || lower.includes("app") || lower.includes("code") || lower.includes("software") || lower.includes("engineer")) {
      return {
        icon: <Code2 size={16} className="text-cyan-400" />,
        boxBg: "bg-cyan-500/10 border-cyan-500/25 text-cyan-400",
        barGradient: "from-cyan-400 to-blue-500",
        glow: "shadow-[0_0_12px_rgba(6,182,212,0.15)]",
      };
    }
    if (lower.includes("design") || lower.includes("graphic") || lower.includes("ui") || lower.includes("ux") || lower.includes("art")) {
      return {
        icon: <Palette size={16} className="text-fuchsia-400" />,
        boxBg: "bg-fuchsia-500/10 border-fuchsia-500/25 text-fuchsia-400",
        barGradient: "from-fuchsia-400 to-pink-500",
        glow: "shadow-[0_0_12px_rgba(217,70,239,0.15)]",
      };
    }
    if (lower.includes("market") || lower.includes("seo") || lower.includes("social") || lower.includes("growth") || lower.includes("content")) {
      return {
        icon: <TrendingUp size={16} className="text-emerald-400" />,
        boxBg: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
        barGradient: "from-emerald-400 to-teal-500",
        glow: "shadow-[0_0_12px_rgba(16,185,129,0.15)]",
      };
    }
    if (lower.includes("sale") || lower.includes("business") || lower.includes("account") || lower.includes("client") || lower.includes("exec")) {
      return {
        icon: <Target size={16} className="text-amber-400" />,
        boxBg: "bg-amber-500/10 border-amber-500/25 text-amber-400",
        barGradient: "from-amber-400 to-orange-500",
        glow: "shadow-[0_0_12px_rgba(245,158,11,0.15)]",
      };
    }
    const palette = [
      {
        icon: <Briefcase size={16} className="text-indigo-400" />,
        boxBg: "bg-indigo-500/10 border-indigo-500/25 text-indigo-400",
        barGradient: "from-indigo-400 to-purple-500",
        glow: "shadow-[0_0_12px_rgba(99,102,241,0.15)]",
      },
      {
        icon: <Building2 size={16} className="text-rose-400" />,
        boxBg: "bg-rose-500/10 border-rose-500/25 text-rose-400",
        barGradient: "from-rose-400 to-red-500",
        glow: "shadow-[0_0_12px_rgba(244,63,94,0.15)]",
      },
    ];
    return palette[index % palette.length];
  }

  const hiredRate = total > 0 ? Math.round((hired / total) * 100) : 0;

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      {/* ─── Hero Header ─────────────────────────────────────────────── */}
      <div className="pb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text flex items-center gap-3">
              Hiring Command Center
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-2)] mt-1.5 max-w-2xl">
              Real-time tracking, AI resume evaluation, and role distribution.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            <Btn
              variant="primary"
              size="sm"
              onClick={() => router.push("/upload")}
              className="flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.25)] transition-all active:scale-95"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Upload Resumes</span>
            </Btn>
          </div>
        </div>
      </div>

      {/* ─── Structured Key KPI Metric Cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Candidates */}
        <div
          onClick={() => {
            setFilters({ search: "", roleId: "all", status: "all", city: "", gender: "all", ageRange: "all", exp: "all", sort: "newest" });
            router.push("/candidates");
          }}
          className="relative overflow-hidden rounded-2xl p-5 border border-white/[0.08] bg-[var(--card-bg)] hover:border-cyan-500/40 hover:bg-[var(--table-row-hover)] transition-all duration-200 cursor-pointer group shadow-lg flex flex-col justify-between"
        >
          <div className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-cyan-500/10 blur-3xl group-hover:bg-cyan-500/20 transition-all" />

          <div>
            {/* Top Row: Icon + Status Pill */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0">
                <Users size={17} />
              </div>
              <span className="text-[10.5px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 whitespace-nowrap">
                Active Pool
              </span>
            </div>

            <div className="flex items-center justify-between mb-2">
              {/* Title & Subtitle */}
              <div>
                <div className="text-sm font-semibold text-text tracking-tight whitespace-nowrap">
                  Total Candidates
                </div>
                <div className="text-[11px] text-[var(--text-3)] font-medium mt-0.5 whitespace-nowrap">
                  Pipeline Intake
                </div>
              </div>

              {/* Primary Value */}
              <div className="text-[32px] font-extrabold tracking-tight text-text leading-none">
                {total}
              </div>
            </div>
          </div>

          {/* Structured Footer */}
          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-[var(--text-2)]">
            <span className="truncate">Resumes parsed &amp; indexed</span>
            <span className="font-mono text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/[0.05] text-[var(--text-2)] border border-border shrink-0">
              {roles.length} Roles
            </span>
          </div>
        </div>

        {/* Card 2: Offers Extended */}
        <div
          onClick={() => {
            setFilters({ search: "", roleId: "all", status: "offer_accepted", city: "", gender: "all", ageRange: "all", exp: "all", sort: "newest" });
            router.push("/candidates");
          }}
          className="relative overflow-hidden rounded-2xl p-5 border border-white/[0.08] bg-[var(--card-bg)] hover:border-emerald-500/40 hover:bg-[var(--table-row-hover)] transition-all duration-200 cursor-pointer group shadow-lg flex flex-col justify-between"
        >
          <div className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-emerald-500/10 blur-3xl group-hover:bg-emerald-500/20 transition-all" />

          <div>
            {/* Top Row: Icon + Status Pill */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                <FileText size={17} />
              </div>
              <span className="text-[10.5px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                {offersStats.total > 0 ? Math.round((offersStats.accepted / offersStats.total) * 100) : 0}% Accept Rate
              </span>
            </div>

            <div className="flex items-center justify-between mb-2">
              {/* Title & Subtitle */}
              <div>
                <div className="text-sm font-semibold text-text tracking-tight whitespace-nowrap">
                  Offers Extended
                </div>
                <div className="text-[11px] text-[var(--text-3)] font-medium mt-0.5 whitespace-nowrap">
                  Contract Status
                </div>
              </div>

              {/* Primary Value */}
              <div className="text-[32px] font-extrabold tracking-tight text-text leading-none">
                {offersStats.total}
              </div>
            </div>
          </div>

          {/* Structured Footer: 3 Clean Badges */}
          <div className="pt-3 border-t border-white/[0.06] flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {offersStats.accepted} Accepted
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              {offersStats.sent} Sent
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-md bg-white/[0.05] text-[var(--text-3)] border border-border font-medium whitespace-nowrap">
              {offersStats.draft} Draft
            </span>
          </div>
        </div>

        {/* Card 3: Avg ATS Score */}
        <div
          onClick={() => {
            setFilters({ search: "", roleId: "all", status: "all", city: "", gender: "all", ageRange: "all", exp: "all", sort: "score-desc" });
            router.push("/candidates");
          }}
          className="relative overflow-hidden rounded-2xl p-5 border border-white/[0.08] bg-[var(--card-bg)] hover:border-purple-500/40 hover:bg-[var(--table-row-hover)] transition-all duration-200 cursor-pointer group shadow-lg flex flex-col justify-between"
        >
          <div className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-purple-500/10 blur-3xl group-hover:bg-purple-500/20 transition-all" />

          <div>
            {/* Top Row: Icon + Status Pill */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 shrink-0">
                <Sparkles size={17} />
              </div>
              <span className="text-[10.5px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 whitespace-nowrap">
                {avgScore >= 70 ? "Strong Fit" : avgScore >= 50 ? "Healthy Pool" : "Expanding"}
              </span>
            </div>

            <div className="flex items-center justify-between mb-2">
              {/* Title & Subtitle */}
              <div>
                <div className="text-sm font-semibold text-text tracking-tight whitespace-nowrap">
                  Average ATS
                </div>
                <div className="text-[11px] text-[var(--text-3)] font-medium mt-0.5 whitespace-nowrap">
                  Candidate Quality
                </div>
              </div>

              {/* Primary Value */}
              <div className="flex items-baseline gap-1.5">
                <span className="text-[32px] font-extrabold tracking-tight text-text leading-none">
                  {avgScore}
                </span>
                <span className="text-sm font-mono text-[var(--text-3)] font-semibold">/ 100</span>
              </div>
            </div>
          </div>

          {/* Structured Footer: Progress Bar + Label */}
          <div className="pt-3 border-t border-white/[0.06] flex flex-col gap-1.5">
            <div className="h-1.5 w-full bg-white/[0.08] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, avgScore))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[var(--text-3)]">
              <span>Weighted evaluation</span>
              <span className="font-mono text-purple-300 font-medium">{avgScore}% benchmark</span>
            </div>
          </div>
        </div>

        {/* Card 4: Interviews Held */}
        <div
          onClick={() => {
            setFilters({ search: "", roleId: "all", status: "shortlisted", city: "", gender: "all", ageRange: "all", exp: "all", sort: "newest" });
            router.push("/candidates");
          }}
          className="relative overflow-hidden rounded-2xl p-5 border border-white/[0.08] bg-[var(--card-bg)] hover:border-amber-500/40 hover:bg-[var(--table-row-hover)] transition-all duration-200 cursor-pointer group shadow-lg flex flex-col justify-between"
        >
          <div className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-amber-500/10 blur-3xl group-hover:bg-amber-500/20 transition-all" />

          <div>
            {/* Top Row: Icon + Status Pill */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
                <Calendar size={17} />
              </div>
              <span className="text-[10.5px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
                Evaluations
              </span>
            </div>

            <div className="flex items-center justify-between mb-2">
              {/* Title & Subtitle */}
              <div>
                <div className="text-sm font-semibold text-text tracking-tight whitespace-nowrap">
                  Interviews Held
                </div>
                <div className="text-[11px] text-[var(--text-3)] font-medium mt-0.5 whitespace-nowrap">
                  Evaluation Rounds
                </div>
              </div>

              {/* Primary Value */}
              <div className="text-[32px] font-extrabold tracking-tight text-text leading-none">
                {interviewStats.total}
              </div>
            </div>
          </div>

          {/* Structured Footer: 2 Clean Badges without any awkward wrapping */}
          <div className="pt-3 border-t border-white/[0.06] flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium whitespace-nowrap flex-1 justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Round 1: {interviewStats.r1}
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium whitespace-nowrap flex-1 justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              Round 2: {interviewStats.r2}
            </span>
          </div>
        </div>
      </div>

            {/* ─── Interactive Pipeline Stage Strip & Talent Quality ───────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
        {/* Left: Hiring Funnel Status */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setShowFunnel(prev => !prev)}
              className={clsx(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 inline-flex items-center gap-2 cursor-pointer border select-none",
                showFunnel
                  ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(0,217,255,0.15)]"
                  : "bg-white/[0.04] border-border text-[var(--text-2)] hover:text-text hover:bg-white/[0.08] hover:border-border-2"
              )}
            >
              <Activity size={14} className={showFunnel ? "text-cyan-400" : "text-[var(--text-3)]"} />
              <span>Hiring Funnel Status</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-[var(--text-3)]">
                {showFunnel ? "Hide" : "Show 6 Stages"}
              </span>
              {showFunnel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showFunnel && (
              <span className="text-[11px] text-[var(--text-3)] hidden sm:inline animate-fade-in">
                Click any stage to filter candidates
              </span>
            )}
          </div>

          {showFunnel && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-in">
              {[
                { 
                  key: "new", 
                  label: "New", 
                  color: "cyan", 
                  bg: "hover:border-cyan-500/30", 
                  dot: "bg-cyan-400",
                  count: newCount,
                },
                { 
                  key: "review", 
                  label: "In Review", 
                  color: "amber", 
                  bg: "hover:border-amber-500/30", 
                  dot: "bg-amber-400",
                  count: inReview,
                },
                { 
                  key: "shortlisted", 
                  label: "Shortlisted", 
                  color: "purple", 
                  bg: "hover:border-purple-500/30", 
                  dot: "bg-purple-400",
                  count: shortlisted,
                },
                { 
                  key: "offer_accepted", 
                  label: "Offered", 
                  color: "emerald", 
                  bg: "hover:border-emerald-500/30", 
                  dot: "bg-emerald-400",
                  count: offerAccepted,
                },
                { 
                  key: "rejected", 
                  label: "Rejected", 
                  color: "rose", 
                  bg: "hover:border-rose-500/30", 
                  dot: "bg-rose-400",
                  count: rejected,
                },
                { 
                  key: "hired", 
                  label: "Hired", 
                  color: "blue", 
                  bg: "hover:border-blue-500/30", 
                  dot: "bg-blue-400",
                  count: hired,
                },
              ].map(stage => {
                const pct = total > 0 ? Math.round((stage.count / total) * 100) : 0;
                return (
                  <button
                    key={stage.key}
                    onClick={() => goFiltered(stage.key)}
                    className={`glass p-3.5 sm:p-4 rounded-xl text-left transition-all duration-200 hover:bg-[var(--glass-2)] ${stage.bg} group relative overflow-hidden cursor-pointer`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${stage.dot}`} />
                        <span className="text-xs font-medium text-[var(--text-2)] group-hover:text-text transition-colors">
                          {stage.label}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-[var(--text-3)]">{pct}%</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-text tracking-tight">
                      {stage.count}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Talent Quality & Score Distribution */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setShowQuality(prev => !prev)}
              className={clsx(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 inline-flex items-center gap-2 cursor-pointer border select-none",
                showQuality
                  ? "bg-purple-500/15 border-purple-500/40 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                  : "bg-white/[0.04] border-border text-[var(--text-2)] hover:text-text hover:bg-white/[0.08] hover:border-border-2"
              )}
            >
              <Sparkles size={14} className={showQuality ? "text-purple-400" : "text-[var(--text-3)]"} />
              <span>Talent Quality & Score Distribution</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-[var(--text-3)]">
                {showQuality ? "Hide" : "Show Breakdown"}
              </span>
              {showQuality ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showQuality && (
              <span className="text-[11px] font-mono text-[var(--text-3)] hidden sm:inline animate-fade-in">
                Total Resumes Evaluated: {total}
              </span>
            )}
          </div>

          {showQuality && (
            <div className="glass p-5 rounded-2xl animate-fade-in">
              {/* Multi-tier bar */}
              <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden flex border border-border mb-3.5">
                <div
                  title={`Exceptional (80+): ${scoreBands.exceptional}`}
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (scoreBands.exceptional / total) * 100 : 0}%` }}
                />
                <div
                  title={`Strong (65-79): ${scoreBands.strong}`}
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (scoreBands.strong / total) * 100 : 0}%` }}
                />
                <div
                  title={`Moderate (45-64): ${scoreBands.moderate}`}
                  className="bg-gradient-to-r from-amber-400 to-orange-400 h-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (scoreBands.moderate / total) * 100 : 0}%` }}
                />
                <div
                  title={`Low (<45): ${scoreBands.low}`}
                  className="bg-gradient-to-r from-rose-500 to-red-500 h-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (scoreBands.low / total) * 100 : 0}%` }}
                />
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 flex-shrink-0" />
                  <div>
                    <span className="text-text font-semibold">{scoreBands.exceptional}</span>
                    <span className="text-[var(--text-3)] ml-1">Exceptional (80+)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 flex-shrink-0" />
                  <div>
                    <span className="text-text font-semibold">{scoreBands.strong}</span>
                    <span className="text-[var(--text-3)] ml-1">Strong (65-79)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 flex-shrink-0" />
                  <div>
                    <span className="text-text font-semibold">{scoreBands.moderate}</span>
                    <span className="text-[var(--text-3)] ml-1">Moderate (45-64)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-400 flex-shrink-0" />
                  <div>
                    <span className="text-text font-semibold">{scoreBands.low}</span>
                    <span className="text-[var(--text-3)] ml-1">Low (&lt;45)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

{/* ─── Two Columns: Top Candidates & By Role (Redesigned!) ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Top Scoring Candidates (7 Cols) */}
        <div className="lg:col-span-8 glass p-5 sm:p-6 rounded-2xl flex flex-col h-[520px]">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border)] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                <Award size={16} />
              </div>
              <div>
                <div className="text-sm sm:text-base font-bold text-text tracking-tight">
                  Top Candidates
                </div>
                <div className="text-[11px] text-[var(--text-3)]">
                  Highest scoring profiles ranked by ATS resume parser
                </div>
              </div>
            </div>
            <Btn
              variant="outline"
              size="sm"
              onClick={() => {
                setFilters({ search: "", roleId: "all", status: "all", city: "", gender: "all", ageRange: "all", exp: "all", sort: "score-desc" });
                router.push("/candidates");
              }}
              className="flex items-center gap-1 text-xs"
            >
              <span>View All</span>
              <ChevronRight size={13} />
            </Btn>
          </div>

          {/* List */}
          {topCandidates.length === 0 ? (
            <div className="font-mono text-xs text-[var(--text-3)] text-center flex-1 flex items-center justify-center">
              No candidates evaluated yet
            </div>
          ) : (
            <div className="space-y-2.5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {topCandidates.map((c, i) => {
                return (
                  <div
                    key={c.id}
                    onClick={() => setInspectCandidate(c)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] hover:border-border transition-all duration-150 cursor-pointer group"
                  >
                    {/* Candidate Avatar Initial */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-border flex items-center justify-center font-bold text-sm text-text flex-shrink-0 group-hover:border-cyan-500/40 transition-colors">
                      {c.name ? c.name[0]?.toUpperCase() : "?"}
                    </div>

                    {/* Candidate Info */}
                    <div className="flex-1 min-w-0 grid grid-cols-2 items-center gap-4">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-text truncate group-hover:text-cyan-400 transition-colors">
                            {c.name}
                          </span>
                          <span className="hidden sm:inline-block font-mono text-[10px] text-[var(--text-3)] flex-shrink-0">
                            {c.city ? `· ${c.city}` : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-[var(--text-2)] truncate">
                            {c.roleName}
                          </span>
                          {c.exp && (
                            <span className="font-mono text-[10px] text-[var(--text-3)] hidden md:inline flex-shrink-0">
                              · {c.exp}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end items-center gap-3 pr-2">
                          <StatusBadge status={c.status} className="hidden sm:inline-flex" />
                          <ScoreBadge score={c.score?.total || 0} />
                          <ArrowUpRight size={14} className="text-[var(--text-3)] opacity-0 group-hover:opacity-100 transition-opacity hidden lg:block" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-3)] flex-shrink-0">
            <span>Showing top 5 talent matches</span>
            <button
              type="button"
              onClick={() => router.push("/candidates")}
              className="text-cyan-400 hover:underline flex items-center gap-1 font-medium"
            >
              Browse all {total} candidates →
            </button>
          </div>
        </div>

        {/* Right Column: By Role & Talent Distribution (User's Specific Image Focus!) (5 Cols) */}
        <div className="lg:col-span-4 glass p-5 sm:p-6 rounded-2xl flex flex-col h-[520px]">
          {/* Header */}
          <div className="flex items-start sm:items-center justify-between pb-4 mb-4 border-b border-[var(--border)] flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 flex-shrink-0">
                <BarChart3 size={16} />
              </div>
              <div className="min-w-0 pr-2">
                <div className="text-sm sm:text-base font-bold text-text tracking-tight flex items-center gap-2">
                  By Role
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-white/5 border border-border text-[var(--text-2)] flex-shrink-0">
                    {roleBreakdown.length} Positions
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-[var(--text-3)] whitespace-nowrap overflow-hidden text-ellipsis">
                  Applicant density & talent score by department
                </div>
              </div>
            </div>
            <Btn
              variant="outline"
              size="sm"
              onClick={() => router.push("/roles")}
              className="flex items-center gap-1 text-xs flex-shrink-0"
            >
              <span>Roles</span>
              <ChevronRight size={13} />
            </Btn>
          </div>

          {/* Role List */}
          {roleBreakdown.length === 0 ? (
            <div className="font-mono text-xs text-[var(--text-3)] text-center flex-1 flex items-center justify-center">
              No active roles configured
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {roleBreakdown.map((r, i) => {
                const visual = getRoleVisual(r.name, i);
                const percentage = total > 0 ? Math.round((r.count / total) * 100) : 0;
                return (
                  <div
                    key={r.id}
                    onClick={() => goRoleFiltered(r.id)}
                    className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] hover:border-border transition-all duration-150 cursor-pointer group flex flex-col gap-2"
                    title={`Click to view all candidates for ${r.name}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0 mr-2">
                        <div className={`w-8 h-8 rounded-lg ${visual.boxBg} border flex items-center justify-center flex-shrink-0 ${visual.glow}`}>
                          {visual.icon}
                        </div>
                        <div className="min-w-0 flex flex-col">
                          <div className="text-[13px] font-semibold text-text truncate group-hover:text-cyan-300 transition-colors">
                            {r.name}
                          </div>
                          <div className="text-[10px] text-[var(--text-3)] font-mono truncate">
                            {r.type || "Full-time"} {r.avgScore > 0 ? `· Avg Score: ${r.avgScore}` : ""}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="font-bold text-text text-sm">
                          {r.count}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--text-3)]">
                          ({percentage}%)
                        </span>
                      </div>
                    </div>

                    {/* Vibrant Custom Progress Bar */}
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-border">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${visual.barGradient} transition-all duration-700`}
                        style={{ width: `${Math.max(percentage, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── Role Insights & Distribution Footer (Fills the previous empty void!) ─── */}
          <div className="mt-4 pt-3.5 border-t border-[var(--border)] flex-shrink-0">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-3)] mb-0.5">
                  Most Demanded
                </div>
                <div className="font-bold text-text truncate text-xs">
                  {topDemandedRole ? topDemandedRole.name : "None"}
                </div>
                <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                  {topDemandedRole ? `${topDemandedRole.count} candidates (${total > 0 ? Math.round(topDemandedRole.count / total * 100) : 0}%)` : "—"}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-3)] mb-0.5">
                  Top Scoring Role
                </div>
                <div className="font-bold text-text truncate text-xs">
                  {highestScoringRole ? highestScoringRole.name : "None"}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                  {highestScoringRole ? `Avg ${highestScoringRole.avgScore} pts` : "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ─── Recent Candidate Stream / Table (Matches Candidate List Page) ─ */}
      <div className="glass p-5 sm:p-6 rounded-2xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
              <Clock size={16} />
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold text-text tracking-tight">
                Recent Candidates
              </div>
              <div className="text-[11px] text-[var(--text-3)]">
                Latest applicant additions and ATS processing activity
              </div>
            </div>
          </div>
          <Btn
            variant="outline"
            size="sm"
            onClick={() => router.push("/candidates")}
            className="flex items-center gap-1 text-xs"
          >
            <span>View All</span>
            <ChevronRight size={13} />
          </Btn>
        </div>

        {recentCandidates.length === 0 ? (
          <div className="font-mono text-xs text-[var(--text-3)] py-8 text-center">
            No recent candidates found
          </div>
        ) : (
          <div
            className="rounded-[11px] overflow-hidden border border-[var(--border-2)]"
            style={{ background: "var(--card-bg)" }}
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead style={{ background: "var(--bg2)" }}>
                  <tr>
                    <th className="font-semibold text-[10.5px] uppercase tracking-[0.06em] text-[var(--text-3)] px-3.5 py-3 text-left border-b border-[var(--table-border)] select-none whitespace-nowrap w-[25%]">
                      Candidate
                    </th>
                    <th className="font-semibold text-[10.5px] uppercase tracking-[0.06em] text-[var(--text-3)] px-3.5 py-3 text-left border-b border-[var(--table-border)] select-none whitespace-nowrap w-[16%]">
                      Role
                    </th>
                    <th className="font-semibold text-[10.5px] uppercase tracking-[0.06em] text-[var(--text-3)] px-3.5 py-3 text-center border-b border-[var(--table-border)] select-none whitespace-nowrap w-[7%]">
                      Score
                    </th>
                    <th className="font-semibold text-[10.5px] uppercase tracking-[0.06em] text-[var(--text-3)] px-3.5 py-3 text-left border-b border-[var(--table-border)] select-none whitespace-nowrap w-[12%]">
                      Status
                    </th>
                    <th className="font-semibold text-[10.5px] uppercase tracking-[0.06em] text-[var(--text-3)] px-3.5 py-3 text-left border-b border-[var(--table-border)] select-none whitespace-nowrap w-[10%]">
                      City
                    </th>
                    <th className="font-semibold text-[10.5px] uppercase tracking-[0.06em] text-[var(--text-3)] px-3.5 py-3 text-left border-b border-[var(--table-border)] select-none whitespace-nowrap w-[12%]">
                      Employment
                    </th>
                    <th className="font-semibold text-[10.5px] uppercase tracking-[0.06em] text-[var(--text-3)] px-3.5 py-3 text-left border-b border-[var(--table-border)] select-none whitespace-nowrap w-[8%]">
                      Exp
                    </th>
                    <th className="font-semibold text-[10.5px] uppercase tracking-[0.06em] text-[var(--text-3)] px-3.5 py-3 text-left border-b border-[var(--table-border)] select-none whitespace-nowrap w-[10%]">
                      Applied
                    </th>
                    <th className="font-semibold text-[10.5px] uppercase tracking-[0.06em] text-[var(--text-3)] px-3.5 py-3 text-right border-b border-[var(--table-border)] select-none whitespace-nowrap w-[36px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentCandidates.map(c => {
                    return (
                      <tr
                        key={c.id}
                        className="h-[54px] hover:bg-[var(--table-row-hover)] transition-colors duration-150 cursor-pointer group"
                        onClick={() => setInspectCandidate(c)}
                      >
                        <td className="px-3.5 py-3 border-b border-[var(--table-border)] align-middle">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/10 to-white/5 border border-border flex items-center justify-center font-bold text-xs text-text shrink-0 group-hover:border-cyan-500/40 transition-colors">
                              {c.name ? c.name[0]?.toUpperCase() : "?"}
                            </div>
                            <div className="flex flex-col justify-center min-w-0">
                              <div className="font-semibold text-sm text-text group-hover:text-cyan-400 transition-colors truncate">
                                {c.name}
                              </div>
                              <div className="text-xs text-[var(--text-3)] truncate mt-0.5">
                                {c.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3.5 py-3 border-b border-[var(--table-border)] align-middle">
                          <div className="text-xs text-[var(--text-2)] font-medium truncate" title={c.roleName}>
                            {c.roleName}
                          </div>
                        </td>
                        <td className="px-3.5 py-3 border-b border-[var(--table-border)] align-middle text-center">
                          <ScoreBadge score={c.score?.total || 0} />
                        </td>
                        <td className="px-3.5 py-3 border-b border-[var(--table-border)] align-middle">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="px-3.5 py-3 border-b border-[var(--table-border)] align-middle text-xs text-[var(--text-2)]">
                          {c.city || "—"}
                        </td>
                        <td className="px-3.5 py-3 border-b border-[var(--table-border)] align-middle">
                          <EmploymentBadge status={c.employmentStatus} />
                        </td>
                        <td className="px-3.5 py-3 border-b border-[var(--table-border)] align-middle text-xs text-[var(--text-2)]">
                          {c.exp || "—"}
                        </td>
                        <td className="px-3.5 py-3 border-b border-[var(--table-border)] align-middle text-xs text-[var(--text-2)] whitespace-nowrap">
                          {c.appliedAt || "—"}
                        </td>
                        <td className="px-3.5 py-3 border-b border-[var(--table-border)] align-middle w-[36px] text-right">
                          <ChevronRight size={15} className="text-[var(--text-3)] group-hover:text-text transition-colors" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ─── Candidate Detail Modal (Opened directly when clicking candidate) ─ */}
      {inspectCandidate && (
        <CandidateDetail
          candidate={inspectCandidate}
          onClose={() => setInspectCandidate(null)}
        />
      )}
    </div>
  );
}
