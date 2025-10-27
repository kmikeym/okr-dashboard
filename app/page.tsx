"use client";

import { db, getCurrentQuarter, getCurrentWave, getDaysFromNow, formatDaysFromNow, calculateProgress } from "@/lib/instant";
import { Activity, Archive, Calendar, Rocket, Target, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const currentQuarter = getCurrentQuarter();
  const currentWave = getCurrentWave();

  // Query for active OKRs and team members
  const { data, isLoading, error } = db.useQuery({
    okrs: {
      keyResults: {},
      $: {
        where: {
          quarter: currentQuarter,
          status: "active",
        },
      },
    },
    members: {},
  });

  return (
    <main className="min-h-screen p-8">
      {/* Header / HUD */}
      <header className="mb-8 border-b border-gray-800 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-mono font-bold text-space-400 text-glow mb-2">
              OKR DASHBOARD
            </h1>
            <p className="text-sm text-gray-400 font-mono uppercase tracking-wider">
              {currentWave}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/create"
              className="px-4 py-2 bg-space-600 hover:bg-space-500 text-white font-mono text-sm uppercase tracking-wider rounded border border-space-400 transition-all"
              style={{
                boxShadow: '0 0 20px rgba(34, 197, 94, 0.4), 0 0 40px rgba(34, 197, 94, 0.2)'
              }}
            >
              + Next Wave
            </Link>
            <Link
              href="/archive"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 font-mono text-sm uppercase tracking-wider rounded border border-gray-700 transition-all"
            >
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4" />
                Archive
              </div>
            </Link>
            <Link
              href="/reflect"
              className="px-4 py-2 bg-gray-800 hover:bg-blue-900 text-space-400 hover:text-blue-300 font-mono text-sm uppercase tracking-wider rounded border border-gray-700 hover:border-blue-500 transition-all"
              style={{
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Reflection Pool
            </Link>
          </div>
        </div>
      </header>

      {/* Status Boards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatusCard
          icon={<Target className="w-6 h-6" />}
          label="Active Objectives"
          value={isLoading ? "—" : data?.okrs?.length || 0}
          status="info"
        />
        <Link href="/key-results">
          <StatusCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Key Results"
            value={
              isLoading
                ? "—"
                : data?.okrs?.reduce((acc, okr) => acc + (okr.keyResults?.length || 0), 0) || 0
            }
            status="normal"
            subtitle="View all key results"
            isClickable={true}
          />
        </Link>
        <StatusCard
          icon={<Activity className="w-6 h-6" />}
          label="Flow Status"
          value={
            isLoading || !data?.okrs
              ? "—"
              : (() => {
                  const okrs = data.okrs;
                  if (okrs.length === 0) return "No Data";
                  const blocked = okrs.filter((o) => o.health === "blocked").length;
                  const atRisk = okrs.filter((o) => o.health === "at-risk").length;
                  const onTrack = okrs.filter((o) => o.health === "on-track").length;

                  if (blocked > 0) return `${blocked} Blocked`;
                  if (atRisk > 0) return `${atRisk} At Risk`;
                  if (onTrack === okrs.length) return "All On-Track";
                  return "Mixed";
                })()
          }
          status={
            isLoading || !data?.okrs
              ? "info"
              : (() => {
                  const okrs = data.okrs;
                  if (okrs.length === 0) return "info";
                  const hasBlocked = okrs.some((o) => o.health === "blocked");
                  const hasAtRisk = okrs.some((o) => o.health === "at-risk");

                  if (hasBlocked) return "critical";
                  if (hasAtRisk) return "warning";
                  return "normal";
                })()
          }
          subtitle={
            isLoading || !data?.okrs
              ? undefined
              : (() => {
                  const okrs = data.okrs;
                  if (okrs.length === 0) return undefined;
                  const blocked = okrs.filter((o) => o.health === "blocked").length;
                  const atRisk = okrs.filter((o) => o.health === "at-risk").length;
                  const onTrack = okrs.filter((o) => o.health === "on-track").length;

                  if (blocked > 0) return "Progress >25% behind schedule";
                  if (atRisk > 0) return "Progress 10-25% behind schedule";
                  if (onTrack === okrs.length) return "Progress on pace with time";
                  return "Mix of on-track and unknown";
                })()
          }
        />
        <Link href="/team">
          <StatusCard
            icon={<Users className="w-6 h-6" />}
            label="Team Members"
            value={isLoading ? "—" : data?.members?.filter(m => m.isActive).length || 0}
            status="info"
            subtitle="Update Team"
            isClickable={true}
          />
        </Link>
      </div>

      {/* Main Tactical Display */}
      <div className="panel p-6 relative overflow-hidden">
        <div className="scanlines"></div>

        <div className="relative z-10">
          <h2 className="text-2xl font-mono font-bold text-space-300 mb-6 uppercase tracking-wide">
            Stream Status
          </h2>

          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-pulse text-space-400">
                <Rocket className="w-12 h-12 mx-auto mb-4" />
                <p className="font-mono text-sm">LOADING MISSION DATA...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center py-12 text-alert-critical">
              <p className="font-mono text-sm">ERROR: {error.message}</p>
            </div>
          )}

          {!isLoading && !error && data?.okrs?.length === 0 && (
            <div className="text-center py-12">
              <Rocket className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 font-mono mb-4">NO ACTIVE MISSIONS</p>
              <Link
                href="/create"
                className="inline-block px-6 py-3 bg-space-600 hover:bg-space-500 text-white font-mono uppercase tracking-wider rounded border border-space-400 transition-all"
                style={{
                  boxShadow: '0 0 20px rgba(34, 197, 94, 0.4), 0 0 40px rgba(34, 197, 94, 0.2)'
                }}
              >
                Initialize First Mission
              </Link>
            </div>
          )}

          {!isLoading && !error && data?.okrs && data.okrs.length > 0 && (
            <div className="space-y-4">
              {data.okrs.map((okr) => (
                <OKRCard key={okr.id} okr={okr} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function StatusCard({
  icon,
  label,
  value,
  status,
  subtitle,
  isClickable = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  status: "critical" | "warning" | "caution" | "normal" | "info";
  subtitle?: string;
  isClickable?: boolean;
}) {
  const statusColors = {
    critical: "text-alert-critical border-alert-critical",
    warning: "text-alert-warning border-alert-warning",
    caution: "text-alert-caution border-alert-caution",
    normal: "text-alert-normal border-alert-normal",
    info: "text-alert-info border-alert-info",
  };

  return (
    <div
      className={`panel p-4 relative ${isClickable ? 'cursor-pointer transition-all duration-300' : ''}`}
      onMouseEnter={isClickable ? (e) => {
        e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.8)';
        e.currentTarget.style.boxShadow = '0 4px 20px -4px rgba(34, 197, 94, 0.6), 0 2px 10px -2px rgba(34, 197, 94, 0.4), 0 0 5px rgba(34, 197, 94, 0.2)';
      } : undefined}
      onMouseLeave={isClickable ? (e) => {
        e.currentTarget.style.backgroundColor = '';
        e.currentTarget.style.boxShadow = 'none';
      } : undefined}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={statusColors[status]}>{icon}</div>
        <p className="text-xs font-mono uppercase text-gray-400 tracking-wider">{label}</p>
      </div>
      <p className={`text-3xl font-mono font-bold ${statusColors[status]}`}>{value}</p>
      {subtitle && (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

function OKRCard({ okr }: { okr: any }) {
  const [countdown, setCountdown] = useState("");

  const keyResults = okr.keyResults || [];
  const progress = keyResults.length > 0
    ? Math.round(
        keyResults.reduce((sum: number, kr: any) => sum + calculateProgress(kr.current, kr.target), 0) /
          keyResults.length
      )
    : 0;

  // Check if all key results are complete
  const allComplete = keyResults.length > 0 && keyResults.every((kr: any) =>
    calculateProgress(kr.current, kr.target) >= 100
  );

  // Calculate time progress
  const now = Date.now();
  const totalDuration = okr.targetDate - okr.createdAt;
  const elapsed = now - okr.createdAt;
  const timeProgress = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
  const progressDelta = progress - timeProgress;

  // Live countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const remaining = okr.targetDate - now;

      if (remaining <= 0) {
        setCountdown("EXPIRED");
        return;
      }

      const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      if (days > 0) {
        setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setCountdown(`${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [okr.targetDate]);

  // Calculate actual health status based on current progress
  let actualHealth = okr.health || "unknown";
  if (!allComplete) {
    // If we're past the target date
    if (now > okr.targetDate) {
      actualHealth = progress >= 100 ? "on-track" : "blocked";
    } else {
      // Calculate based on progress delta
      if (progressDelta >= -10) {
        actualHealth = "on-track";
      } else if (progressDelta >= -25) {
        actualHealth = "at-risk";
      } else {
        actualHealth = "blocked";
      }
    }
  }

  const healthColor = {
    "on-track": "text-alert-normal",
    "at-risk": "text-alert-warning",
    blocked: "text-alert-critical",
    unknown: "text-gray-400",
  }[actualHealth];

  return (
    <Link href={`/okr/${okr.id}`}>
      <div className="panel p-5 panel-hover cursor-pointer border-l-4 border-l-space-500">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-mono font-bold text-white mb-1">{okr.title}</h3>
            {okr.description && (
              <p className="text-sm text-gray-400">{okr.description}</p>
            )}
          </div>
          <div className={`px-3 py-1 rounded font-mono text-xs uppercase ${allComplete ? 'text-space-400 border-space-400' : healthColor} border border-current`}>
            {allComplete ? 'Done' : actualHealth}
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between text-xs font-mono mb-1">
            <span className="text-gray-400">% COMPLETE</span>
            <span className="text-white font-bold">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden relative">
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to right,
                  rgb(239, 68, 68) 0%,
                  rgb(234, 179, 8) 50%,
                  rgb(34, 197, 94) 100%)`,
                clipPath: `inset(0 ${100 - progress}% 0 0)`,
                transition: 'clip-path 0.5s ease'
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono mt-1">
            <span className="text-gray-500">SCHEDULE</span>
            <span className={`font-bold ${
              progressDelta > 0
                ? 'text-alert-normal'
                : progressDelta === 0
                ? 'text-space-400'
                : progressDelta > -10
                ? 'text-alert-warning'
                : 'text-alert-critical'
            }`}>
              {progressDelta > 0 && `${progressDelta}% ahead`}
              {progressDelta === 0 && 'On Time'}
              {progressDelta < 0 && `${Math.abs(progressDelta)}% behind`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
          <span>{keyResults.length} Key Results</span>
          <span>•</span>
          {okr.targetDate && (
            <>
              <span className="flex items-center gap-1 text-gray-400">
                <Calendar className="w-3 h-3 text-space-400" />
                <span>{new Date(okr.targetDate).toLocaleDateString()}</span>
              </span>
              <span>•</span>
              <span className={`font-mono tabular-nums ${
                countdown === "EXPIRED"
                  ? 'text-alert-critical font-bold'
                  : getDaysFromNow(okr.targetDate) < 1
                  ? 'text-alert-critical'
                  : getDaysFromNow(okr.targetDate) < 7
                  ? 'text-alert-warning'
                  : 'text-space-400'
              }`}>
                {countdown || "Loading..."}
              </span>
              <span>•</span>
            </>
          )}
          <span className="text-gray-500">
            Updated {new Date(okr.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
