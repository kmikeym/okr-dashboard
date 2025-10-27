"use client";

import { db, id } from "@/lib/instant";
import { ArrowLeft, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const SPACESHIP_ROLES = [
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

// Function to get role rank for sorting
function getRoleRank(role: string): number {
  const index = SPACESHIP_ROLES.indexOf(role);
  return index === -1 ? 999 : index; // Unknown roles go to the end
}

export default function TeamManagement() {
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("");
  const [showFormerTeam, setShowFormerTeam] = useState(false);

  const { data, isLoading } = db.useQuery({
    members: {},
    keyResults: {},
  });

  // Separate active and inactive members
  const allMembers = (data?.members || []).sort((a, b) => {
    const rankA = getRoleRank(a.email); // email field stores role
    const rankB = getRoleRank(b.email);
    return rankA - rankB;
  });

  const activeMembers = allMembers.filter(m => m.isActive);
  const formerMembers = allMembers.filter(m => !m.isActive);

  // Count KRs per member and calculate their overall progress
  const keyResults = data?.keyResults || [];
  const getKRCount = (memberName: string) => {
    return keyResults.filter((kr) => kr.owner === memberName).length;
  };

  const getMemberProgress = (memberName: string) => {
    const memberKRs = keyResults.filter((kr) => kr.owner === memberName);
    if (memberKRs.length === 0) return 0;

    const totalProgress = memberKRs.reduce((sum, kr) => {
      const progress = Math.min(100, Math.round((kr.current / kr.target) * 100));
      return sum + progress;
    }, 0);

    return Math.round(totalProgress / memberKRs.length);
  };

  const addMember = async () => {
    if (!newMemberName.trim() || !newMemberRole.trim()) {
      alert("Please enter both name and role");
      return;
    }

    const memberId = id();
    const activityId = id();
    const now = Date.now();

    // Easter egg: Mike is always the Janitor
    const finalRole = newMemberName.trim().toLowerCase() === "mike"
      ? "Janitor"
      : newMemberRole.trim();

    await db.transact([
      db.tx!.members[memberId]!.update({
        name: newMemberName.trim(),
        email: finalRole, // Using email field to store role
        role: "member",
        isActive: true,
        joinedAt: now,
      }),
      // Log activity
      db.tx!.activities[activityId]!.update({
        type: "created",
        description: `Added team member: ${newMemberName.trim()} (${finalRole})`,
        author: "Team", // TODO: Add real user auth
        timestamp: now,
      }),
    ]);

    setNewMemberName("");
    setNewMemberRole("");
  };

  const toggleActive = async (memberId: string, currentActive: boolean, memberName: string, memberRole: string) => {
    const activityId = id();
    const now = Date.now();
    const action = currentActive ? "Deactivated" : "Activated";

    await db.transact([
      db.tx!.members[memberId]!.update({
        isActive: !currentActive,
      }),
      // Log activity
      db.tx!.activities[activityId]!.update({
        type: "updated",
        description: `${action} team member: ${memberName} (${memberRole})`,
        author: "Team", // TODO: Add real user auth
        timestamp: now,
      }),
    ]);
  };

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
              TEAM ROSTER
            </h1>
            <p className="text-gray-400">Manage team members and assignments</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded font-mono text-sm bg-gray-800 border border-gray-700">
              <Users className="w-5 h-5 text-space-400" />
              <span className="text-white">{activeMembers.length} Active Members</span>
            </div>
            {formerMembers.length > 0 && (
              <button
                onClick={() => setShowFormerTeam(!showFormerTeam)}
                className="px-4 py-2 font-mono text-sm uppercase rounded border border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors"
              >
                {showFormerTeam ? "Hide" : "Show"} Former Team ({formerMembers.length})
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Active Team Members */}
      <div className="panel p-6 mb-6">
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-500 font-mono text-sm">LOADING ROSTER...</p>
          </div>
        )}

        {!isLoading && activeMembers.length === 0 && !showFormerTeam && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-500 font-mono text-sm">No team members yet</p>
          </div>
        )}

        {!isLoading && activeMembers.length > 0 && (
          <>
            <h2 className="text-xl font-mono font-bold text-space-300 uppercase mb-4">
              Active Crew
            </h2>
            <div className="space-y-3">
              {activeMembers.map((member) => {
              const krCount = getKRCount(member.name);
              const progress = getMemberProgress(member.name);
              return (
                <div
                  key={member.id}
                  className="bg-gray-900 border border-gray-700 rounded p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-mono text-white">{member.name}</h3>
                        <span className="text-sm text-space-400 font-mono">• {member.email}</span>
                      </div>
                      <p className="text-sm text-gray-400 font-mono">
                        {krCount} Key {krCount === 1 ? "Result" : "Results"}
                      </p>
                    </div>
                    {krCount > 0 && (
                      <div className="text-right ml-4">
                        <div className="text-xl font-mono font-bold text-space-400">{progress}%</div>
                        <div className="text-xs font-mono text-gray-500 uppercase">Progress</div>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {krCount > 0 && (
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-3 relative">
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
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(member.id, member.isActive, member.name, member.email)}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 font-mono text-sm uppercase rounded transition-colors"
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          </>
        )}

        {/* Former Team Members */}
        {!isLoading && showFormerTeam && formerMembers.length > 0 && (
          <>
            <h2 className="text-xl font-mono font-bold text-gray-500 uppercase mb-4 mt-8">
              Former Crew
            </h2>
            <div className="space-y-3">
              {formerMembers.map((member) => {
                const krCount = getKRCount(member.name);
                const progress = getMemberProgress(member.name);
                return (
                  <div
                    key={member.id}
                    className="bg-gray-900 border border-gray-700 rounded p-4 opacity-60"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-mono text-white">{member.name}</h3>
                          <span className="text-sm text-gray-500 font-mono">• {member.email}</span>
                          <span className="px-2 py-1 bg-gray-800 text-gray-500 text-xs font-mono uppercase rounded">
                            Former
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 font-mono">
                          {krCount} Key {krCount === 1 ? "Result" : "Results"}
                        </p>
                      </div>
                      {krCount > 0 && (
                        <div className="text-right ml-4">
                          <div className="text-xl font-mono font-bold text-gray-500">{progress}%</div>
                          <div className="text-xs font-mono text-gray-600 uppercase">Progress</div>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {krCount > 0 && (
                      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-3 relative">
                        <div
                          className="absolute inset-0 opacity-50"
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
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActive(member.id, member.isActive, member.name, member.email)}
                        className="px-4 py-2 bg-space-600 hover:bg-space-500 text-white font-mono text-sm uppercase rounded transition-colors"
                      >
                        Reactivate
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Add New Member */}
      <div className="panel p-6">
        <h2 className="text-xl font-mono font-bold text-space-300 uppercase mb-4">
          Add Team Member
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-mono uppercase text-gray-400 mb-2">
              Name
            </label>
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="e.g., James Holden"
              className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-3 text-white font-mono focus:border-space-400 focus:outline-none transition-colors"
              onKeyDown={(e) => e.key === "Enter" && addMember()}
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase text-gray-400 mb-2">
              Ship Role
            </label>
            <select
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-3 text-white font-mono focus:border-space-400 focus:outline-none transition-colors"
            >
              <option value="">Select Role...</option>
              {SPACESHIP_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={addMember}
          className="flex items-center gap-2 px-6 py-3 bg-space-600 hover:bg-space-500 text-white font-mono text-sm uppercase rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>
    </main>
  );
}
