"use client";

import { db, id, getCurrentQuarter, getCurrentWave } from "@/lib/instant";
import {
  ArrowLeft,
  Calendar,
  Edit2,
  FileText,
  MessageSquare,
  Plus,
  Target,
  TrendingUp,
  User,
  X
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function ReflectionMode() {
  const currentQuarter = getCurrentQuarter();
  const currentWave = getCurrentWave();

  const { data, isLoading } = db.useQuery({
    activities: {
      comments: {},
    },
  });

  const [showNoteForm, setShowNoteForm] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState("");

  // Sort activities by timestamp, most recent first
  const activities = (data?.activities || []).sort((a, b) => b.timestamp - a.timestamp);

  const addNote = async (activityId: string) => {
    if (!noteContent.trim()) {
      alert("Please enter a note");
      return;
    }

    const commentId = id();
    const now = Date.now();

    await db.transact([
      db.tx.comments[commentId].update({
        content: noteContent.trim(),
        author: "Team", // TODO: Add real user auth
        createdAt: now,
        isResolved: false,
      }).link({ activity: activityId }),
    ]);

    setNoteContent("");
    setShowNoteForm(null);
  };

  const getActivityNotes = (activity: any) => {
    return activity.comments || [];
  };

  return (
    <main className="min-h-screen p-8 relative overflow-hidden">
      {/* Animated Starfield Background */}
      <div className="starfield"></div>

      <div className="relative z-10">
        <header className="mb-8 border-b border-gray-800 pb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-space-400 font-mono text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            RETURN TO OKR DASHBOARD
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-mono font-bold text-space-400 text-glow mb-2">
                REFLECTION POOL
              </h1>
              <p className="text-gray-400">
                Activity timeline
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded font-mono text-sm bg-gray-800 border border-gray-700">
              <FileText className="w-5 h-5 text-space-400" />
              <span className="text-white">{activities.length} Activities</span>
            </div>
          </div>
        </header>

        {isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-500 font-mono text-sm">LOADING MISSION LOG...</p>
          </div>
        )}

        {!isLoading && activities.length === 0 && (
          <div className="panel p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-500 font-mono text-sm">No activities recorded yet</p>
            <p className="text-gray-600 font-mono text-xs mt-2">
              Activity will be logged automatically as you create and update OKRs
            </p>
          </div>
        )}

        {!isLoading && activities.length > 0 && (
          <div className="space-y-6">
            {/* Timeline */}
            <div className="relative">
              {/* Vertical line - positioned at left-6 + (w-5/2) to center on dots */}
              <div className="absolute left-[34px] top-0 bottom-0 w-1 bg-space-500"></div>

              {activities.map((activity, index) => {
                const notes = getActivityNotes(activity);
                return (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    notes={notes}
                    isFirst={index === 0}
                    showNoteForm={showNoteForm === activity.id}
                    noteContent={noteContent}
                    onShowNoteForm={() => setShowNoteForm(activity.id)}
                    onHideNoteForm={() => setShowNoteForm(null)}
                    onNoteContentChange={setNoteContent}
                    onAddNote={() => addNote(activity.id)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Starfield CSS */}
      <style jsx>{`
        .starfield {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background:
            radial-gradient(2px 2px at 20px 30px, white, transparent),
            radial-gradient(2px 2px at 60px 70px, white, transparent),
            radial-gradient(1px 1px at 50px 50px, white, transparent),
            radial-gradient(1px 1px at 130px 80px, white, transparent),
            radial-gradient(2px 2px at 90px 10px, white, transparent),
            radial-gradient(1px 1px at 160px 120px, white, transparent),
            radial-gradient(1px 1px at 20px 150px, white, transparent),
            radial-gradient(2px 2px at 200px 90px, white, transparent),
            radial-gradient(1px 1px at 140px 180px, white, transparent),
            radial-gradient(1px 1px at 250px 40px, white, transparent);
          background-size: 300px 300px;
          background-position: 0 0;
          opacity: 0.3;
          animation: twinkle 200s linear infinite;
          pointer-events: none;
          z-index: 0;
        }

        @keyframes twinkle {
          from {
            background-position: 0 0;
          }
          to {
            background-position: -10000px 5000px;
          }
        }
      `}</style>
    </main>
  );
}

function ActivityCard({
  activity,
  notes,
  isFirst,
  showNoteForm,
  noteContent,
  onShowNoteForm,
  onHideNoteForm,
  onNoteContentChange,
  onAddNote,
}: {
  activity: any;
  notes: any[];
  isFirst: boolean;
  showNoteForm: boolean;
  noteContent: string;
  onShowNoteForm: () => void;
  onHideNoteForm: () => void;
  onNoteContentChange: (content: string) => void;
  onAddNote: () => void;
}) {
  const getActivityIcon = () => {
    switch (activity.type) {
      case "created": return <Plus className="w-5 h-5" />;
      case "updated": return <Edit2 className="w-5 h-5" />;
      case "completed": return <Target className="w-5 h-5" />;
      case "commented": return <MessageSquare className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getActivityColor = () => {
    switch (activity.type) {
      case "created": return "text-alert-normal border-alert-normal bg-green-500/10";
      case "updated": return "text-alert-info border-alert-info bg-blue-500/10";
      case "completed": return "text-space-400 border-space-400 bg-cyan-500/10";
      case "commented": return "text-alert-warning border-alert-warning bg-yellow-500/10";
      default: return "text-gray-400 border-gray-400 bg-gray-500/10";
    }
  };

  return (
    <div className="relative pl-20 pb-8">
      {/* Timeline dot */}
      <div className={`absolute left-6 top-2 w-5 h-5 rounded-full border-2 ${getActivityColor()} flex items-center justify-center`}>
        {isFirst && (
          <div className="absolute w-3 h-3 rounded-full bg-current animate-ping"></div>
        )}
      </div>

      {/* Activity Card */}
      <div className="panel p-5 panel-hover">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded border ${getActivityColor()}`}>
              {getActivityIcon()}
            </div>
            <div>
              <p className="text-sm font-mono text-white uppercase tracking-wider">
                {activity.type}
              </p>
              <p className="text-xs font-mono text-gray-500">
                {new Date(activity.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={showNoteForm ? onHideNoteForm : onShowNoteForm}
            className="p-2 text-gray-500 hover:text-space-400 transition-colors"
            title="Add Note"
          >
            {showNoteForm ? <X className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
          </button>
        </div>

        <p className="text-gray-300 font-mono text-sm mb-2">{activity.description}</p>

        {activity.author && (
          <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
            <User className="w-3 h-3" />
            {activity.author}
          </div>
        )}

        {/* Note Form */}
        {showNoteForm && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <label className="block text-xs font-mono uppercase text-gray-400 mb-2">
              Add Reflection Note
            </label>
            <textarea
              value={noteContent}
              onChange={(e) => onNoteContentChange(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white font-mono text-sm focus:border-space-400 focus:outline-none transition-colors resize-none mb-2"
              rows={3}
              placeholder="Why did this change happen? What did we learn?"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={onAddNote}
                className="px-4 py-2 bg-space-600 hover:bg-space-500 text-white font-mono text-sm uppercase rounded transition-colors"
              >
                Save Note
              </button>
              <button
                onClick={onHideNoteForm}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-mono text-sm uppercase rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Display Notes */}
        {notes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
            <p className="text-xs font-mono uppercase text-gray-400">Reflection Notes</p>
            {notes.map((note) => (
              <div key={note.id} className="bg-gray-800/50 rounded p-3 border-l-2 border-space-400">
                <p className="text-sm text-gray-300 mb-2">{note.content}</p>
                <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                  <User className="w-3 h-3" />
                  {note.author} • {new Date(note.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
