"use client";

import { db, id, getCurrentQuarter, OKRStatus } from "@/lib/instant";
import { Plus, Target, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateOKR() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Query team members for owner selection
  const { data: teamData } = db.useQuery({
    members: {},
  });
  const activeMembers = teamData?.members?.filter((m) => m.isActive) || [];

  // Default to 90 days from now
  const defaultTargetDate = new Date();
  defaultTargetDate.setDate(defaultTargetDate.getDate() + 90);
  const [targetDate, setTargetDate] = useState(
    defaultTargetDate.toISOString().split('T')[0]!
  );

  const [keyResults, setKeyResults] = useState([
    { description: "", target: 100, unit: "%", owner: "" },
    { description: "", target: 100, unit: "%", owner: "" },
  ]);

  const addKeyResult = () => {
    setKeyResults([...keyResults, { description: "", target: 100, unit: "%", owner: "" }]);
  };

  const removeKeyResult = (index: number) => {
    if (keyResults.length > 1) {
      setKeyResults(keyResults.filter((_, i) => i !== index));
    }
  };

  const updateKeyResult = (index: number, field: string, value: string | number) => {
    const updated = [...keyResults];
    updated[index] = { ...updated[index]!, [field]: value };
    setKeyResults(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter an objective title");
      return;
    }

    const validKRs = keyResults.filter((kr) => kr.description.trim());
    if (validKRs.length === 0) {
      alert("Please add at least one key result");
      return;
    }

    const okrId = id();
    const now = Date.now();
    const quarter = getCurrentQuarter();
    const targetDateTimestamp = new Date(targetDate).getTime();

    try {
      const activityId = id();

      await db.transact([
        db.tx.okrs[okrId].update({
          title: title.trim(),
          description: description.trim() || undefined,
          quarter,
          status: OKRStatus.ACTIVE,
          health: "on-track", // New OKRs start on-track at 0% progress
          targetDate: targetDateTimestamp,
          createdAt: now,
          createdBy: "Team", // TODO: Add real user auth
          updatedAt: now,
        }),
        ...validKRs.map((kr) =>
          db.tx.keyResults[id()]
            .update({
              description: kr.description.trim(),
              target: Number(kr.target),
              current: 0,
              unit: kr.unit,
              status: "on-track",
              owner: kr.owner || "Unassigned",
              createdAt: now,
              updatedAt: now,
            })
            .link({ okr: okrId })
        ),
        // Log activity
        db.tx.activities[activityId].update({
          type: "created",
          description: `Created OKR: ${title.trim()}`,
          author: "Team", // TODO: Add real user auth
          timestamp: now,
        }),
      ]);

      // Success! Go back to home
      router.push("/");
    } catch (error) {
      console.error("Failed to create OKR:", error);
      alert("Failed to create OKR. Check console for details.");
    }
  };

  return (
    <main className="min-h-screen p-8">
      {/* Header */}
      <header className="mb-8 border-b border-gray-800 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-mono font-bold text-space-400 text-glow mb-2">
              NEW MISSION BRIEFING
            </h1>
            <p className="text-sm text-gray-400 font-mono uppercase tracking-wider">
              Initialize Objective & Key Results
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 text-gray-400 hover:text-white font-mono uppercase tracking-wider border border-gray-700 rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-4xl">
        {/* Objective Section */}
        <div className="panel p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-6 h-6 text-space-400" />
            <h2 className="text-xl font-mono font-bold text-space-300 uppercase">
              Primary Objective
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-gray-400 mb-2">
                Objective Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Launch new product feature successfully"
                className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-3 text-white font-mono focus:border-space-400 focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-400 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional context or notes..."
                rows={3}
                className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-3 text-white font-mono focus:border-space-400 focus:outline-none transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-400 mb-2">
                Target Completion Date (Default: 90 days)
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-3 text-white font-mono focus:border-space-400 focus:outline-none transition-colors"
                required
              />
              <p className="text-xs text-gray-500 font-mono mt-1">
                Time allocated to achieve this objective
              </p>
            </div>
          </div>
        </div>

        {/* Key Results Section */}
        <div className="panel p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-mono font-bold text-space-300 uppercase">
              Key Results
            </h2>
          </div>

          <div className="space-y-4">
            {keyResults.map((kr, index) => (
              <div
                key={index}
                className="bg-gray-900 border border-gray-700 rounded p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-xs font-mono uppercase text-gray-400 mb-2">
                        Key Result #{index + 1}
                      </label>
                      <input
                        type="text"
                        value={kr.description}
                        onChange={(e) =>
                          updateKeyResult(index, "description", e.target.value)
                        }
                        placeholder="e.g., Achieve 10,000 active users"
                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white font-mono text-sm focus:border-space-400 focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-mono uppercase text-gray-400 mb-2">
                          Target
                        </label>
                        <input
                          type="number"
                          value={kr.target}
                          onChange={(e) =>
                            updateKeyResult(index, "target", e.target.value)
                          }
                          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white font-mono text-sm focus:border-space-400 focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono uppercase text-gray-400 mb-2">
                          Unit
                        </label>
                        <input
                          type="text"
                          value={kr.unit}
                          onChange={(e) =>
                            updateKeyResult(index, "unit", e.target.value)
                          }
                          placeholder="%"
                          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white font-mono text-sm focus:border-space-400 focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono uppercase text-gray-400 mb-2">
                          Owner
                        </label>
                        <select
                          value={kr.owner}
                          onChange={(e) =>
                            updateKeyResult(index, "owner", e.target.value)
                          }
                          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white font-mono text-sm focus:border-space-400 focus:outline-none transition-colors"
                        >
                          <option value="">Unassigned</option>
                          {activeMembers.map((member) => (
                            <option key={member.id} value={member.name}>
                              {member.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {keyResults.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeKeyResult(index)}
                      className="mt-6 p-2 text-gray-500 hover:text-red-400 transition-colors"
                      title="Remove"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addKeyResult}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-space-400 font-mono text-sm uppercase rounded border border-gray-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Key Result
          </button>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="px-8 py-4 bg-space-600 hover:bg-space-500 text-white font-mono uppercase tracking-wider rounded border border-space-400 transition-all text-lg"
            style={{
              boxShadow: '0 0 20px rgba(34, 197, 94, 0.4), 0 0 40px rgba(34, 197, 94, 0.2)'
            }}
          >
            Initialize Mission
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-mono uppercase tracking-wider rounded border border-gray-600 transition-all"
          >
            Abort
          </button>
        </div>
      </form>
    </main>
  );
}
