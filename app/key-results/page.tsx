"use client";

import { db, id, calculateProgress, getCurrentQuarter } from "@/lib/instant";
import { ArrowLeft, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function KeyResultsPage() {
  const currentQuarter = getCurrentQuarter();

  const { data, isLoading } = db.useQuery({
    okrs: {
      keyResults: {},
      $: {
        where: {
          quarter: currentQuarter,
          status: "active",
        },
      },
    },
  });

  // Flatten all key results with their parent OKR info
  const allKeyResults = (data?.okrs || []).flatMap((okr) =>
    (okr.keyResults || []).map((kr) => ({
      ...kr,
      okrTitle: okr.title,
      okrId: okr.id,
      okrHealth: okr.health,
    }))
  );

  return (
    <main className="min-h-screen p-8">
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
            <h1 className="text-4xl font-mono font-bold text-space-400 text-glow mb-2">
              KEY RESULTS TRACKER
            </h1>
            <p className="text-gray-400">
              All key results for {currentQuarter} • {allKeyResults.length} Total
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded font-mono text-sm bg-gray-800 border border-gray-700">
            <TrendingUp className="w-5 h-5 text-space-400" />
            <span className="text-white">{allKeyResults.length} Key Results</span>
          </div>
        </div>
      </header>

      <div className="panel p-6">
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-500 font-mono text-sm">LOADING KEY RESULTS...</p>
          </div>
        )}

        {!isLoading && allKeyResults.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-500 font-mono text-sm mb-4">No key results found</p>
            <Link
              href="/create"
              className="inline-block px-6 py-3 bg-space-600 hover:bg-space-500 text-white font-mono uppercase tracking-wider rounded border border-space-400 transition-all"
              style={{
                boxShadow: '0 0 20px rgba(34, 197, 94, 0.4), 0 0 40px rgba(34, 197, 94, 0.2)'
              }}
            >
              Create First OKR
            </Link>
          </div>
        )}

        {!isLoading && allKeyResults.length > 0 && (
          <div className="space-y-4">
            {allKeyResults.map((kr) => (
              <KeyResultRow key={kr.id} keyResult={kr} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function KeyResultRow({ keyResult }: { keyResult: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(keyResult.current);

  const progress = calculateProgress(keyResult.current, keyResult.target);

  const handleSave = async () => {
    const now = Date.now();
    const activityId = id();

    await db.transact([
      db.tx!.keyResults[keyResult.id]!.update({
        current: Number(currentValue),
        updatedAt: now,
      }),
      // Log activity
      db.tx!.activities[activityId]!.update({
        type: "updated",
        description: `Updated progress on "${keyResult.description}" to ${currentValue}/${keyResult.target} ${keyResult.unit}`,
        author: "Team", // TODO: Add real user auth
        timestamp: now,
      }),
    ]);
    setIsEditing(false);
  };

  const health: "on-track" | "at-risk" | "blocked" | "unknown" = keyResult.okrHealth || "unknown";
  const healthColor = {
    "on-track": "text-alert-normal",
    "at-risk": "text-alert-warning",
    blocked: "text-alert-critical",
    unknown: "text-gray-400",
  }[health];

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 hover:border-gray-600 transition-colors">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Left: KR Info */}
        <div className="lg:col-span-5">
          <Link
            href={`/okr/${keyResult.okrId}`}
            className="text-xs font-mono text-gray-500 uppercase hover:text-space-400 transition-colors mb-1 inline-block"
          >
            {keyResult.okrTitle}
          </Link>
          <h3 className="text-lg font-mono text-white mb-1">{keyResult.description}</h3>
          <div className="flex items-center gap-3 text-xs font-mono text-gray-500">
            <span>Owner: <span className="text-space-400">{keyResult.owner}</span></span>
            <span>•</span>
            <span className={healthColor}>{keyResult.okrHealth || "Unknown"}</span>
          </div>
        </div>

        {/* Middle: Progress Bar */}
        <div className="lg:col-span-4">
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs font-mono text-gray-500 mb-1">
              <span>PROGRESS</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden relative">
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to right,
                    rgb(239, 68, 68) 0%,
                    rgb(234, 179, 8) 50%,
                    rgb(34, 197, 94) 100%)`,
                  clipPath: `inset(0 ${100 - progress}% 0 0)`,
                  transition: 'clip-path 0.3s ease'
                }}
              />
            </div>
          </div>
          <p className="text-xs font-mono text-gray-500 text-center">
            {keyResult.current} / {keyResult.target} {keyResult.unit}
          </p>
        </div>

        {/* Right: Update Progress */}
        <div className="lg:col-span-3">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white font-mono text-sm focus:border-space-400 focus:outline-none"
                min="0"
                max={keyResult.target}
              />
              <button
                onClick={handleSave}
                className="px-3 py-2 bg-space-600 hover:bg-space-500 text-white font-mono text-xs uppercase rounded transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setCurrentValue(keyResult.current);
                  setIsEditing(false);
                }}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white font-mono text-xs uppercase rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-space-400 font-mono text-sm uppercase rounded border border-gray-700 transition-colors"
            >
              Update
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
