"use client";

import { db, id, calculateProgress, getDaysFromNow, formatDaysFromNow, calculateHealthStatus } from "@/lib/instant";
import { ArrowLeft, Calendar, Edit2, Save, Target, TrendingUp, X, Trash2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function OKRDetail() {
  const params = useParams();
  const router = useRouter();
  const okrId = params?.id as string;

  const [isEditingOKR, setIsEditingOKR] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedTargetDate, setEditedTargetDate] = useState("");
  const [showDeleteOKRConfirm, setShowDeleteOKRConfirm] = useState(false);
  const [showCompleteOKRConfirm, setShowCompleteOKRConfirm] = useState(false);

  const { data, isLoading, error } = db.useQuery({
    okrs: {
      keyResults: {},
      $: {
        where: {
          id: okrId,
        },
      },
    },
    members: {},
  });

  const okr = data?.okrs?.[0];
  const activeMembers = data?.members?.filter((m) => m.isActive) || [];

  const startEditingOKR = () => {
    if (okr) {
      setEditedTitle(okr.title);
      setEditedDescription(okr.description || "");

      // Handle targetDate - use current date if not set
      if (okr.targetDate) {
        setEditedTargetDate(new Date(okr.targetDate).toISOString().split('T')[0]!);
      } else {
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 90);
        setEditedTargetDate(defaultDate.toISOString().split('T')[0]!);
      }

      setIsEditingOKR(true);
    }
  };

  const saveOKREdit = async () => {
    if (!editedTitle.trim()) {
      alert("Title is required");
      return;
    }

    const now = Date.now();
    const targetDateTimestamp = new Date(editedTargetDate).getTime();
    const activityId = id();

    await db.transact([
      db.tx!.okrs[okrId]!.update({
        title: editedTitle.trim(),
        description: editedDescription.trim() || undefined,
        targetDate: targetDateTimestamp,
        updatedAt: now,
      }),
      // Log activity
      db.tx!.activities[activityId]!.update({
        type: "updated",
        description: `Updated OKR: ${editedTitle.trim()}`,
        author: "Team", // TODO: Add real user auth
        timestamp: now,
      }),
    ]);

    setIsEditingOKR(false);
  };

  const cancelOKREdit = () => {
    setIsEditingOKR(false);
  };

  const deleteOKR = async () => {
    const now = Date.now();
    const activityId = id();

    await db.transact([
      db.tx!.okrs[okrId]!.delete(),
      // Log activity
      db.tx!.activities[activityId]!.update({
        type: "updated",
        description: `Deleted OKR: ${okr?.title}`,
        author: "Team", // TODO: Add real user auth
        timestamp: now,
      }),
    ]);

    // Navigate back to home
    router.push("/");
  };

  const completeOKR = async () => {
    const now = Date.now();
    const activityId = id();
    const keyResults = okr?.keyResults || [];

    // Build transaction to mark OKR as completed and set all KRs to their target values
    const transactions: any[] = [
      db.tx!.okrs[okrId]!.update({
        status: "completed",
        updatedAt: now,
      }),
      // Log activity
      db.tx!.activities[activityId]!.update({
        type: "completed",
        description: `Completed OKR: ${okr?.title}`,
        author: "Team", // TODO: Add real user auth
        timestamp: now,
      }),
    ];

    // Mark all key results as complete by setting current = target
    keyResults.forEach((kr: any) => {
      transactions.push(
        db.tx!.keyResults[kr.id]!.update({
          current: kr.target,
          updatedAt: now,
        })
      );
    });

    await db.transact(transactions);

    // Navigate to archive
    router.push("/archive");
  };

  const updateKeyResultProgress = async (krId: string, newCurrent: number) => {
    const now = Date.now();

    // Recalculate overall progress with the new value
    const keyResults = okr?.keyResults || [];
    const kr = keyResults.find((k) => k.id === krId);
    const updatedProgress = Math.round(
      keyResults.reduce((sum, kr) => {
        const current = kr.id === krId ? newCurrent : kr.current;
        return sum + calculateProgress(current, kr.target);
      }, 0) / keyResults.length
    );

    // Calculate new health status based on time vs progress
    const newHealth = okr?.createdAt && okr?.targetDate
      ? calculateHealthStatus(okr.createdAt, okr.targetDate, updatedProgress)
      : "unknown";

    const activityId = id();

    await db.transact([
      db.tx!.keyResults[krId]!.update({
        current: newCurrent,
        updatedAt: now,
      }),
      db.tx!.okrs[okrId]!.update({
        health: newHealth,
        updatedAt: now,
      }),
      // Log activity
      db.tx!.activities[activityId]!.update({
        type: "updated",
        description: `Updated progress on "${kr?.description}" to ${newCurrent}/${kr?.target} ${kr?.unit}`,
        author: "Team", // TODO: Add real user auth
        timestamp: now,
      }),
    ]);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-pulse text-space-400">
            <TrendingUp className="w-12 h-12 mx-auto mb-4" />
            <p className="font-mono text-sm">LOADING MISSION DATA...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !okr) {
    return (
      <main className="min-h-screen p-8">
        <div className="text-center py-12 text-alert-critical">
          <p className="font-mono text-sm">ERROR: Mission not found</p>
          <Link
            href="/"
            className="inline-block mt-4 px-4 py-2 bg-gray-800 text-white font-mono text-sm rounded"
          >
            Return to Command Center
          </Link>
        </div>
      </main>
    );
  }

  const keyResults = okr.keyResults || [];
  const totalProgress =
    keyResults.length > 0
      ? Math.round(
          keyResults.reduce((sum, kr) => sum + calculateProgress(kr.current, kr.target), 0) /
            keyResults.length
        )
      : 0;

  // Calculate time-based expected progress
  const timeProgress = okr.createdAt && okr.targetDate
    ? Math.min(100, Math.max(0, Math.round(
        ((Date.now() - okr.createdAt) / (okr.targetDate - okr.createdAt)) * 100
      )))
    : 0;

  const healthColor = {
    "on-track": "text-alert-normal",
    "at-risk": "text-alert-warning",
    blocked: "text-alert-critical",
    unknown: "text-gray-400",
  }[okr.health || "unknown"];

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
          <div className="flex-1">
            {isEditingOKR ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-3 text-white font-mono text-2xl focus:border-space-400 focus:outline-none transition-colors"
                  placeholder="Objective title"
                />
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-3 text-white font-mono focus:border-space-400 focus:outline-none transition-colors resize-none"
                  placeholder="Description (optional)"
                  rows={2}
                />
                <div className="flex items-center gap-3">
                  <label className="text-xs font-mono uppercase text-gray-400">Target Date:</label>
                  <input
                    type="date"
                    value={editedTargetDate}
                    onChange={(e) => setEditedTargetDate(e.target.value)}
                    className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white font-mono text-sm focus:border-space-400 focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={saveOKREdit}
                    className="flex items-center gap-2 px-4 py-2 bg-space-600 hover:bg-space-500 text-white font-mono text-sm uppercase rounded transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={cancelOKREdit}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-mono text-sm uppercase rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowDeleteOKRConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-900 hover:bg-red-800 text-red-400 font-mono text-sm uppercase rounded transition-colors border border-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-4xl font-mono font-bold text-white mb-2">{okr.title}</h1>
                {okr.description && <p className="text-gray-400 text-lg">{okr.description}</p>}
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!isEditingOKR && (
              <>
                <button
                  onClick={() => setShowCompleteOKRConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-space-600 hover:bg-space-500 text-white font-mono text-sm uppercase rounded border border-space-400 transition-colors"
                >
                  <Target className="w-4 h-4" />
                  Mark Complete
                </button>
                <button
                  onClick={startEditingOKR}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-space-400 font-mono text-sm uppercase rounded border border-gray-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteOKRConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-900 hover:bg-red-800 text-red-400 font-mono text-sm uppercase rounded border border-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </>
            )}
            <div className={`px-4 py-2 rounded font-mono text-sm uppercase ${healthColor} border border-current`}>
              {okr.health || "Unknown"}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-6 text-sm font-mono">
          <span className="text-gray-500">Wave: {okr.quarter}</span>
          {okr.targetDate && (
            <>
              <span className="text-gray-700">•</span>
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-space-400" />
                <span className="text-white">
                  Target: {new Date(okr.targetDate).toLocaleDateString()}
                </span>
                <span className={`ml-1 ${getDaysFromNow(okr.targetDate) < 0 ? 'text-alert-critical' : getDaysFromNow(okr.targetDate) < 30 ? 'text-alert-warning' : 'text-gray-400'}`}>
                  {formatDaysFromNow(getDaysFromNow(okr.targetDate))}
                </span>
              </span>
            </>
          )}
          <span className="text-gray-700">•</span>
          <span className="text-gray-600">Updated: {new Date(okr.updatedAt).toLocaleDateString()}</span>
        </div>
      </header>

      {/* Overall Progress */}
      <div className="panel p-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-mono font-bold text-space-300 uppercase">
            Flow Progress
          </h2>
          <span className="text-3xl font-mono font-bold text-space-400">{totalProgress}%</span>
        </div>

        {/* Actual Progress Bar */}
        <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden relative mb-2">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right,
                rgb(239, 68, 68) 0%,
                rgb(234, 179, 8) 50%,
                rgb(34, 197, 94) 100%)`,
              clipPath: `inset(0 ${100 - totalProgress}% 0 0)`,
              transition: 'clip-path 0.5s ease'
            }}
          />
        </div>

        {/* Time-based Expected Progress Indicator */}
        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden relative mb-2">
          <div
            className="absolute inset-0 bg-gray-500 opacity-50"
            style={{
              clipPath: `inset(0 ${100 - timeProgress}% 0 0)`,
              transition: 'clip-path 0.5s ease'
            }}
          />
        </div>

        <div className="flex items-center justify-between text-xs font-mono text-gray-500">
          <span>Expected Progress: {timeProgress}% (time elapsed)</span>
          <span className={totalProgress >= timeProgress ? 'text-alert-normal' : totalProgress >= timeProgress - 10 ? 'text-alert-warning' : 'text-alert-critical'}>
            {totalProgress >= timeProgress ? `+${totalProgress - timeProgress}% ahead` : `${totalProgress - timeProgress}% behind`}
          </span>
        </div>
      </div>

      {/* Key Results */}
      <div className="panel p-6">
        <h2 className="text-2xl font-mono font-bold text-space-300 uppercase mb-6">
          Key Results
        </h2>

        {keyResults.length === 0 ? (
          <p className="text-gray-500 font-mono text-center py-8">No key results defined</p>
        ) : (
          <div className="space-y-6">
            {keyResults.map((kr) => (
              <KeyResultCard
                key={kr.id}
                keyResult={kr}
                onUpdate={(newCurrent) => updateKeyResultProgress(kr.id, newCurrent)}
                activeMembers={activeMembers}
                okrId={okrId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Complete OKR Confirmation Modal */}
      {showCompleteOKRConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border-2 border-space-400 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-space-500/10 rounded-lg">
                <Target className="w-8 h-8 text-space-400" />
              </div>
              <div>
                <h3 className="text-xl font-mono font-bold text-space-400 uppercase">Mark OKR Complete</h3>
                <p className="text-sm text-gray-400 font-mono">This will archive the OKR</p>
              </div>
            </div>

            <div className="mb-6 p-4 bg-space-500/5 border border-space-500/20 rounded">
              <p className="text-gray-300 font-mono text-sm mb-2">
                You are about to mark as complete:
              </p>
              <p className="text-white font-mono font-bold mb-3">"{okr?.title}"</p>
              {keyResults.length > 0 && (
                <p className="text-space-400 font-mono text-xs">
                  This will also mark all {keyResults.length} key result{keyResults.length > 1 ? 's' : ''} as complete and move the OKR to the archive.
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={completeOKR}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-space-600 hover:bg-space-500 text-white font-mono text-sm uppercase rounded transition-colors"
              >
                <Target className="w-4 h-4" />
                Confirm Complete
              </button>
              <button
                onClick={() => setShowCompleteOKRConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-mono text-sm uppercase rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete OKR Confirmation Modal */}
      {showDeleteOKRConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border-2 border-red-500 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-mono font-bold text-red-400 uppercase">Delete OKR</h3>
                <p className="text-sm text-gray-400 font-mono">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-6 p-4 bg-red-500/5 border border-red-500/20 rounded">
              <p className="text-gray-300 font-mono text-sm mb-2">
                You are about to delete:
              </p>
              <p className="text-white font-mono font-bold">"{okr?.title}"</p>
              {keyResults.length > 0 && (
                <p className="text-red-400 font-mono text-xs mt-3">
                  This will also delete {keyResults.length} key result{keyResults.length > 1 ? 's' : ''}.
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={deleteOKR}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-mono text-sm uppercase rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Confirm Delete
              </button>
              <button
                onClick={() => setShowDeleteOKRConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-mono text-sm uppercase rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function KeyResultCard({
  keyResult,
  onUpdate,
  activeMembers,
  okrId,
}: {
  keyResult: any;
  onUpdate: (newCurrent: number) => void;
  activeMembers: any[];
  okrId: string;
}) {
  const [isEditingProgress, setIsEditingProgress] = useState(false);
  const [isEditingKR, setIsEditingKR] = useState(false);
  const [currentValue, setCurrentValue] = useState(keyResult.current);
  const [editedDescription, setEditedDescription] = useState(keyResult.description);
  const [editedTarget, setEditedTarget] = useState(keyResult.target);
  const [editedUnit, setEditedUnit] = useState(keyResult.unit);
  const [editedOwner, setEditedOwner] = useState(keyResult.owner);
  const [showDeleteKRConfirm, setShowDeleteKRConfirm] = useState(false);

  const progress = calculateProgress(keyResult.current, keyResult.target);

  const handleProgressSave = () => {
    onUpdate(Number(currentValue));
    setIsEditingProgress(false);
  };

  const handleKRSave = async () => {
    if (!editedDescription.trim()) {
      alert("Description is required");
      return;
    }

    const now = Date.now();
    const activityId = id();

    await db.transact([
      db.tx!.keyResults[keyResult.id]!.update({
        description: editedDescription.trim(),
        target: Number(editedTarget),
        unit: editedUnit,
        owner: editedOwner,
        updatedAt: now,
      }),
      // Log activity
      db.tx!.activities[activityId]!.update({
        type: "updated",
        description: `Updated Key Result: ${editedDescription.trim()}`,
        author: "Team", // TODO: Add real user auth
        timestamp: now,
      }),
    ]);

    setIsEditingKR(false);
  };

  const deleteKR = async () => {
    const now = Date.now();
    const activityId = id();

    await db.transact([
      db.tx!.keyResults[keyResult.id]!.delete(),
      // Update OKR timestamp
      db.tx!.okrs[okrId]!.update({
        updatedAt: now,
      }),
      // Log activity
      db.tx!.activities[activityId]!.update({
        type: "updated",
        description: `Deleted Key Result: ${keyResult.description}`,
        author: "Team", // TODO: Add real user auth
        timestamp: now,
      }),
    ]);

    setShowDeleteKRConfirm(false);
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-5">
      {isEditingKR ? (
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-xs font-mono uppercase text-gray-400 mb-2">Description</label>
            <input
              type="text"
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white font-mono text-sm focus:border-space-400 focus:outline-none transition-colors"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-gray-400 mb-2">Target</label>
              <input
                type="number"
                value={editedTarget}
                onChange={(e) => setEditedTarget(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white font-mono text-sm focus:border-space-400 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-gray-400 mb-2">Unit</label>
              <input
                type="text"
                value={editedUnit}
                onChange={(e) => setEditedUnit(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white font-mono text-sm focus:border-space-400 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-gray-400 mb-2">Owner</label>
              <select
                value={editedOwner}
                onChange={(e) => setEditedOwner(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white font-mono text-sm focus:border-space-400 focus:outline-none transition-colors"
              >
                <option value="Unassigned">Unassigned</option>
                {activeMembers.map((member) => (
                  <option key={member.id} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleKRSave}
              className="flex items-center gap-2 px-4 py-2 bg-space-600 hover:bg-space-500 text-white font-mono text-sm uppercase rounded transition-colors"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={() => setIsEditingKR(false)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-mono text-sm uppercase rounded transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={() => setShowDeleteKRConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-900 hover:bg-red-800 text-red-400 font-mono text-sm uppercase rounded transition-colors border border-red-700"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-mono text-white mb-1">{keyResult.description}</h3>
            <p className="text-xs font-mono text-gray-500 uppercase">Owner: {keyResult.owner}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditingKR(true)}
              className="p-2 text-gray-500 hover:text-space-400 transition-colors"
              title="Edit Key Result"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteKRConfirm(true)}
              className="p-2 text-gray-500 hover:text-red-400 transition-colors"
              title="Delete Key Result"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="text-right">
              <div className="text-2xl font-mono font-bold text-space-400">{progress}%</div>
              <div className="text-xs font-mono text-gray-500">
                {keyResult.current} / {keyResult.target} {keyResult.unit}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden mb-4 relative">
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

      {/* Update Progress */}
      {!isEditingKR && (
        <div className="flex items-center gap-3">
          {isEditingProgress ? (
            <>
              <input
                type="number"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white font-mono text-sm focus:border-space-400 focus:outline-none"
                min="0"
                max={keyResult.target}
              />
              <button
                onClick={handleProgressSave}
                className="px-4 py-2 bg-space-600 hover:bg-space-500 text-white font-mono text-sm uppercase rounded transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setCurrentValue(keyResult.current);
                  setIsEditingProgress(false);
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-mono text-sm uppercase rounded transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditingProgress(true)}
              className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-space-400 font-mono text-sm uppercase rounded border border-gray-700 transition-colors"
            >
              Update Progress
            </button>
          )}
        </div>
      )}

      {/* Delete KR Confirmation Modal */}
      {showDeleteKRConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border-2 border-red-500 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-mono font-bold text-red-400 uppercase">Delete Key Result</h3>
                <p className="text-sm text-gray-400 font-mono">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-6 p-4 bg-red-500/5 border border-red-500/20 rounded">
              <p className="text-gray-300 font-mono text-sm mb-2">
                You are about to delete:
              </p>
              <p className="text-white font-mono font-bold mb-2">"{keyResult.description}"</p>
              <p className="text-gray-400 font-mono text-xs">
                Target: {keyResult.current}/{keyResult.target} {keyResult.unit} ({progress}%)
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={deleteKR}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-mono text-sm uppercase rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Confirm Delete
              </button>
              <button
                onClick={() => setShowDeleteKRConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-mono text-sm uppercase rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
