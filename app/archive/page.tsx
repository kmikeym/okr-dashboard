"use client";

import { db, calculateProgress, getDaysFromNow, formatDaysFromNow } from "@/lib/instant";
import { Archive, ArrowLeft, Calendar, Target } from "lucide-react";
import Link from "next/link";

export default function ArchivePage() {
  const { data, isLoading } = db.useQuery({
    okrs: {
      keyResults: {},
      $: {
        where: {
          status: "completed",
        },
      },
    },
  });

  const completedOKRs = (data?.okrs || []).sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <main className="min-h-screen p-8">
      {/* Header */}
      <header className="mb-8 border-b border-gray-800 pb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-space-400 font-mono text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          RETURN TO COMMAND CENTER
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-mono font-bold text-gray-500 mb-2">
              MISSION ARCHIVE
            </h1>
            <p className="text-gray-500 font-mono uppercase tracking-wider">
              Completed Objectives • Lights Off
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded font-mono text-sm bg-gray-800/50 border border-gray-700">
            <Archive className="w-5 h-5 text-gray-500" />
            <span className="text-gray-400">{completedOKRs.length} Archived</span>
          </div>
        </div>
      </header>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-pulse text-gray-600">
            <Archive className="w-12 h-12 mx-auto mb-4" />
            <p className="font-mono text-sm">LOADING ARCHIVE...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && completedOKRs.length === 0 && (
        <div className="panel p-12 text-center opacity-50">
          <Archive className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-500 font-mono text-sm">No completed missions yet</p>
          <p className="text-gray-600 font-mono text-xs mt-2">
            Completed OKRs will appear here
          </p>
        </div>
      )}

      {/* Archive Grid */}
      {!isLoading && completedOKRs.length > 0 && (
        <div className="space-y-4">
          {completedOKRs.map((okr) => (
            <ArchivedOKRCard key={okr.id} okr={okr} />
          ))}
        </div>
      )}
    </main>
  );
}

function ArchivedOKRCard({ okr }: { okr: any }) {
  const keyResults = okr.keyResults || [];
  const progress = keyResults.length > 0
    ? Math.round(
        keyResults.reduce((sum: number, kr: any) => sum + calculateProgress(kr.current, kr.target), 0) /
          keyResults.length
      )
    : 0;

  return (
    <Link href={`/okr/${okr.id}`}>
      <div className="panel p-5 panel-hover cursor-pointer border-l-4 border-l-gray-700 opacity-60 hover:opacity-80 transition-opacity">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-mono font-bold text-gray-500">{okr.title}</h3>
              <div className="px-3 py-1 rounded font-mono text-xs uppercase text-gray-500 border border-gray-600 bg-gray-800/30">
                Completed
              </div>
            </div>
            {okr.description && (
              <p className="text-sm text-gray-600">{okr.description}</p>
            )}
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between text-xs font-mono mb-1">
            <span className="text-gray-600">FINAL PROGRESS</span>
            <span className="text-gray-500 font-bold">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden relative">
            <div
              className="absolute inset-0 bg-gray-600 opacity-50"
              style={{
                clipPath: `inset(0 ${100 - progress}% 0 0)`,
                transition: 'clip-path 0.5s ease'
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-gray-600">
          <span>{keyResults.length} Key Results</span>
          <span>•</span>
          <span className="text-gray-600">Wave</span>
          {okr.targetDate && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gray-600" />
                <span>Target: {new Date(okr.targetDate).toLocaleDateString()}</span>
              </span>
            </>
          )}
          <span>•</span>
          <span className="text-gray-600">
            Completed {new Date(okr.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
