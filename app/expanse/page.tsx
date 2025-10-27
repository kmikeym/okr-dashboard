"use client";

import { db, getCurrentQuarter, getDaysFromNow, formatDaysFromNow, calculateProgress } from "@/lib/instant";
import {
  Activity,
  ArrowLeft,
  Calendar,
  Rocket,
  Target,
  TrendingUp,
  Users,
  Anchor,
  Wrench,
  Crosshair,
  Radio,
  Microscope,
  Heart,
  Navigation,
  Settings,
  Shield,
  Hammer,
  Trash2
} from "lucide-react";
import Link from "next/link";

export default function ExpanseDashboard() {
  const currentQuarter = getCurrentQuarter();

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
    keyResults: {},
  });

  const okrs = data?.okrs || [];
  const totalKRs = okrs.reduce((acc, okr) => acc + (okr.keyResults?.length || 0), 0);
  const activeMembers = (data?.members || []).filter(m => m.isActive);
  const allKeyResults = data?.keyResults || [];

  // Calculate crew member progress
  const crewWithProgress = activeMembers.map(member => {
    const memberKRs = allKeyResults.filter(kr => kr.owner === member.name);
    const avgProgress = memberKRs.length > 0
      ? Math.round(
          memberKRs.reduce((sum, kr) => sum + calculateProgress(kr.current, kr.target), 0) / memberKRs.length
        )
      : 0;
    return {
      ...member,
      krCount: memberKRs.length,
      progress: avgProgress,
    };
  }).sort((a, b) => {
    // Sort by role rank (using the getRoleRank from team page)
    const roles = [
      "Captain",
      "Executive Officer (XO)",
      "Pilot",
      "Engineer",
      "Tactical Officer",
      "Communications Officer",
      "Science Officer",
      "Medical Officer",
      "Navigator",
      "Operations Officer",
      "Security Chief",
      "Deck Chief",
      "Janitor",
    ];
    const rankA = roles.indexOf(a.email);
    const rankB = roles.indexOf(b.email);
    return (rankA === -1 ? 999 : rankA) - (rankB === -1 ? 999 : rankB);
  });

  // Calculate overall progress
  const overallProgress = okrs.length > 0
    ? Math.round(
        okrs.reduce((sum, okr) => {
          const keyResults = okr.keyResults || [];
          const okrProgress = keyResults.length > 0
            ? keyResults.reduce((krSum, kr) => krSum + calculateProgress(kr.current, kr.target), 0) / keyResults.length
            : 0;
          return sum + okrProgress;
        }, 0) / okrs.length
      )
    : 0;

  // Health stats
  const blocked = okrs.filter((o) => o.health === "blocked").length;
  const atRisk = okrs.filter((o) => o.health === "at-risk").length;
  const onTrack = okrs.filter((o) => o.health === "on-track").length;

  return (
    <main className="min-h-screen bg-black text-cyan-400 relative overflow-hidden">
      {/* Animated grid background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'gridScroll 20s linear infinite'
        }}></div>
      </div>

      {/* Scanlines */}
      <div className="scanlines-expanse"></div>

      <div className="relative z-10 p-8">
        {/* Top Navigation Bar */}
        <div className="border-2 border-cyan-500/50 bg-black/80 backdrop-blur mb-6 p-4 relative">
          {/* Color accent block */}
          <div className="absolute top-0 right-0 w-32 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>

          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-mono text-sm uppercase tracking-widest"
            >
              <ArrowLeft className="w-4 h-4" />
              Standard View
            </Link>
            <div className="flex items-center gap-6">
              <div className="text-xs font-mono text-cyan-400/60 uppercase tracking-wider">
                TACTICAL OPERATIONS CENTER
              </div>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Console Header */}
        <div className="border-2 border-cyan-500/50 bg-black/80 backdrop-blur p-4 mb-4 relative">
          <div className="absolute top-0 left-40 right-40 h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
          <div className="absolute bottom-0 left-40 right-40 h-0.5 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>

          <div className="flex items-center justify-between gap-6">
            {/* Left - Mission Period & Progress */}
            <div className="flex items-center gap-6">
              <div>
                <div className="text-[10px] font-mono text-cyan-400/60 uppercase tracking-wider mb-1">Mission Period</div>
                <div className="text-lg font-mono text-cyan-400">{currentQuarter}</div>
              </div>

              <div className="h-12 w-px bg-cyan-500/30"></div>

              {/* Circular Progress - Compact */}
              <div className="relative w-16 h-16">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(34, 211, 238, 0.2)" strokeWidth="2" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="rgba(34, 211, 238, 0.8)"
                    strokeWidth="3"
                    strokeDasharray={`${overallProgress * 2.513} 251.3`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-sm font-mono text-cyan-400 font-bold">{overallProgress}%</div>
                </div>
              </div>

              <div className="h-12 w-px bg-cyan-500/30"></div>

              {/* Quick Stats */}
              <div className="flex gap-4 text-xs font-mono">
                <div>
                  <div className="text-cyan-400/60">OKRs</div>
                  <div className="text-cyan-400 font-bold">{okrs.length}</div>
                </div>
                <div>
                  <div className="text-cyan-400/60">KRs</div>
                  <div className="text-cyan-400 font-bold">{totalKRs}</div>
                </div>
                <div>
                  <div className="text-cyan-400/60">Crew</div>
                  <div className="text-cyan-400 font-bold">{activeMembers.length}</div>
                </div>
              </div>
            </div>

            {/* Center - Flow Status */}
            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-green-400">{onTrack}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span className="text-yellow-400">{atRisk}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-red-400">{blocked}</span>
              </div>
            </div>

            {/* Right - Quick Actions */}
            <div className="flex items-center gap-2">
              <Link
                href="/key-results"
                className="border border-cyan-500/50 bg-cyan-500/5 hover:bg-cyan-500/10 px-3 py-1.5 text-xs font-mono text-cyan-400 uppercase tracking-wider transition-all relative"
              >
                KRs
              </Link>
              <Link
                href="/team"
                className="border border-cyan-500/50 bg-cyan-500/5 hover:bg-cyan-500/10 px-3 py-1.5 text-xs font-mono text-cyan-400 uppercase tracking-wider transition-all relative"
              >
                Crew
              </Link>
              <Link
                href="/create"
                className="border border-green-500/50 bg-green-500/10 hover:bg-green-500/20 px-3 py-1.5 text-xs font-mono text-green-400 uppercase tracking-wider transition-all relative"
              >
                + New
              </Link>
              <Link
                href="/reflect"
                className="border border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20 px-3 py-1.5 text-xs font-mono text-yellow-400 uppercase tracking-wider transition-all relative"
              >
                Log
              </Link>
            </div>
          </div>
        </div>

        {/* Mission List */}
        {okrs.length > 0 && (
          <div className="mt-6 border-2 border-cyan-500/50 bg-black/80 backdrop-blur p-6 relative">
            <div className="absolute top-0 left-40 w-32 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
            <div className="absolute bottom-0 right-40 w-32 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>

            <div className="text-xs font-mono text-cyan-400/60 uppercase tracking-wider mb-4">Active Missions</div>
            <div className="space-y-4">
              {okrs.map((okr) => (
                <MissionCard key={okr.id} okr={okr} />
              ))}
            </div>
          </div>
        )}

        {okrs.length === 0 && !isLoading && (
          <div className="mt-6 border-2 border-cyan-500/50 bg-black/80 backdrop-blur p-12 text-center relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>

            <div className="text-cyan-400/60 font-mono uppercase mb-4">No Active Missions</div>
            <Link
              href="/create"
              className="inline-block border-2 border-cyan-500 bg-cyan-500/10 hover:bg-cyan-500/20 px-6 py-3 font-mono text-sm uppercase tracking-wider text-cyan-400 transition-all relative"
            >
              <div className="absolute top-0 right-0 w-16 h-1 bg-green-500"></div>
              Initialize First Mission
            </Link>
          </div>
        )}

        {/* Crew Status */}
        {crewWithProgress.length > 0 && (
          <div className="mt-6 border-2 border-cyan-500/50 bg-black/80 backdrop-blur p-6 relative">
            <div className="absolute top-0 right-20 w-24 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
            <div className="absolute bottom-0 left-20 w-24 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>

            <div className="text-xs font-mono text-cyan-400/60 uppercase tracking-wider mb-4">Crew Status</div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {crewWithProgress.map((crew) => (
                <CrewIndicator key={crew.id} crew={crew} />
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes gridScroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }

        .scanlines-expanse {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            rgba(0, 255, 255, 0) 50%,
            rgba(0, 255, 255, 0.02) 50%
          );
          background-size: 100% 4px;
          pointer-events: none;
          z-index: 1;
        }
      `}</style>
    </main>
  );
}

function MetricLine({ label, value, max, color, suffix = "" }: { label: string; value: number; max: number; color: string; suffix?: string }) {
  const percentage = (value / max) * 100;
  const colorClasses = {
    cyan: 'bg-cyan-500/60',
    green: 'bg-green-500/60',
    yellow: 'bg-yellow-500/60',
  };

  const barCount = 100; // Number of squares
  const filledBars = Math.floor((percentage / 100) * barCount);

  return (
    <div>
      <div className="flex items-center justify-between text-xs font-mono mb-1">
        <span className="text-cyan-400/60">{label}</span>
        <span className="text-cyan-400">{value}{suffix}</span>
      </div>
      <div className="flex gap-[1px]">
        {Array.from({ length: barCount }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 transition-all ${
              i < filledBars
                ? colorClasses[color as keyof typeof colorClasses]
                : 'bg-cyan-900/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function HealthBar({ label, count, color }: { label: string; count: number; color: string }) {
  const colorClasses = {
    green: 'text-green-400 border-green-500',
    yellow: 'text-yellow-400 border-yellow-500',
    red: 'text-red-400 border-red-500',
  };

  return (
    <div className={`border-l-2 ${colorClasses[color as keyof typeof colorClasses]} pl-2 py-1 relative`}>
      {count > 0 && <div className={`absolute right-0 top-0 w-1 h-full ${colorClasses[color as keyof typeof colorClasses].replace('text-', 'bg-').replace('border-', 'bg-')} opacity-30`}></div>}
      <div className="flex items-center justify-between text-xs font-mono">
        <span>{label}</span>
        <span className="text-lg font-bold">{count}</span>
      </div>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 px-3 py-2 text-xs font-mono text-cyan-400 uppercase tracking-wider transition-all relative"
    >
      <div className="absolute left-0 top-0 w-1 h-full bg-cyan-500/30"></div>
      → {label}
    </Link>
  );
}

function MissionCard({ okr }: { okr: any }) {
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
    "on-track": "border-green-500 text-green-400 bg-green-500/5",
    "at-risk": "border-yellow-500 text-yellow-400 bg-yellow-500/5",
    blocked: "border-red-500 text-red-400 bg-red-500/5",
    unknown: "border-cyan-500 text-cyan-400 bg-cyan-500/5",
  }[actualHealth];

  const accentColor = {
    "on-track": "bg-green-500",
    "at-risk": "bg-yellow-500",
    blocked: "bg-red-500",
    unknown: "bg-cyan-500",
  }[actualHealth];

  return (
    <Link href={`/okr/${okr.id}`}>
      <div className="border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 p-4 transition-all cursor-pointer group relative">
        {/* Status accent bar */}
        <div className={`absolute top-0 right-0 w-24 h-1 ${accentColor}`}></div>
        <div className="absolute left-0 top-0 w-1 h-16 bg-cyan-500/30"></div>

        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-mono text-cyan-400 mb-1 group-hover:text-cyan-300">{okr.title}</h3>
            {okr.description && (
              <p className="text-sm text-cyan-400/60 font-mono">{okr.description}</p>
            )}
          </div>
          <div className={`border ${allComplete ? 'border-cyan-400 text-cyan-400 bg-cyan-400/10' : healthColor} px-2 py-1 text-xs font-mono uppercase ml-4 relative`}>
            <div className={`absolute bottom-0 left-0 w-8 h-0.5 ${allComplete ? 'bg-cyan-400' : accentColor}`}></div>
            {allComplete ? 'Done' : actualHealth}
          </div>
        </div>

        <div className="mb-2">
          <div className="flex items-center justify-between text-xs font-mono mb-1">
            <span className="text-cyan-400/60">% COMPLETE</span>
            <span className="text-cyan-400 font-bold">{progress}%</span>
          </div>
          <div className="flex gap-[1px]">
            {Array.from({ length: 100 }).map((_, i) => {
              const barProgress = (i / 100) * 100;
              let color = 'bg-cyan-900/30';
              if (barProgress < progress) {
                if (barProgress < 33) {
                  color = 'bg-red-500/70';
                } else if (barProgress < 66) {
                  color = 'bg-yellow-500/70';
                } else {
                  color = 'bg-green-500/70';
                }
              }
              return (
                <div
                  key={i}
                  className={`flex-1 h-1.5 transition-all ${color}`}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono mt-1">
            <span className="text-cyan-400/40">SCHEDULE</span>
            <span className={`font-bold ${
              progressDelta > 0
                ? 'text-green-400'
                : progressDelta === 0
                ? 'text-cyan-400'
                : progressDelta > -10
                ? 'text-yellow-400'
                : 'text-red-400'
            }`}>
              {progressDelta > 0 && `${progressDelta}% ahead`}
              {progressDelta === 0 && 'On Time'}
              {progressDelta < 0 && `${Math.abs(progressDelta)}% behind`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-cyan-400/60">
          <span>{keyResults.length} Key Results</span>
          {okr.targetDate && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(okr.targetDate).toLocaleDateString()}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

function getRoleIcon(role: string) {
  const iconMap: Record<string, any> = {
    "Captain": Anchor,
    "Executive Officer (XO)": Users,
    "Pilot": Navigation,
    "Engineer": Wrench,
    "Tactical Officer": Crosshair,
    "Communications Officer": Radio,
    "Science Officer": Microscope,
    "Medical Officer": Heart,
    "Navigator": Navigation,
    "Operations Officer": Settings,
    "Security Chief": Shield,
    "Deck Chief": Hammer,
    "Janitor": Trash2,
  };

  return iconMap[role] || Users;
}

function CrewIndicator({ crew }: { crew: any }) {
  const RoleIcon = getRoleIcon(crew.email); // email field stores role

  // Progress color
  const progressColor = crew.progress >= 75
    ? 'text-green-400 border-green-500'
    : crew.progress >= 50
    ? 'text-yellow-400 border-yellow-500'
    : crew.progress > 0
    ? 'text-orange-400 border-orange-500'
    : 'text-gray-500 border-gray-600';

  return (
    <div className="border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 p-3 transition-all relative group">
      {/* Role accent */}
      <div className="absolute top-0 right-0 w-8 h-0.5 bg-cyan-500/50"></div>

      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 border border-cyan-500/50 bg-cyan-500/10 rounded">
          <RoleIcon className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-mono text-cyan-400 truncate">{crew.name}</div>
          <div className="text-[10px] font-mono text-cyan-400/50 truncate uppercase">{crew.email}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-1">
        <div className="text-[10px] font-mono text-cyan-400/60 uppercase">KRs: {crew.krCount}</div>
        <div className={`text-sm font-mono font-bold ${progressColor.split(' ')[0]}`}>{crew.progress}%</div>
      </div>

      {/* Mini progress bar - squares */}
      <div className="flex gap-[1px]">
        {Array.from({ length: 100 }).map((_, i) => {
          const barFilled = (i / 100) * 100 < crew.progress;
          return (
            <div
              key={i}
              className={`flex-1 h-1 transition-all ${
                barFilled
                  ? progressColor.split(' ')[0].replace('text-', 'bg-')
                  : 'bg-cyan-900/30'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
