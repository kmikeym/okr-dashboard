import { i } from "@instantdb/react";

// OKR Game Board Schema
// Designed for ~8 person teams with collaborative OKR creation and tracking

const graph = i.graph(
  {
    // Main OKR objectives
    okrs: i.entity({
      title: i.string(),
      description: i.string().optional(),
      quarter: i.string(), // e.g., "2025-Q1"
      status: i.string(), // 'draft' | 'active' | 'completed' | 'archived'
      health: i.string().optional(), // 'on-track' | 'at-risk' | 'blocked' | 'unknown'
      targetDate: i.number(), // Target completion timestamp (default: createdAt + 90 days)
      createdAt: i.number(),
      createdBy: i.string(),
      updatedAt: i.number(),
      completedAt: i.number().optional(),
    }),

    // Key Results for each OKR
    keyResults: i.entity({
      description: i.string(),
      target: i.number(), // Target value
      current: i.number(), // Current progress
      unit: i.string(), // e.g., "users", "revenue", "%", "days"
      status: i.string(), // 'on-track' | 'at-risk' | 'blocked'
      owner: i.string(), // Team member responsible
      createdAt: i.number(),
      updatedAt: i.number(),
    }),

    // Reflection items (used during planning phase)
    reflections: i.entity({
      type: i.string(), // 'moment' | 'learning' | 'advice' | 'trend' | 'event'
      content: i.string(),
      author: i.string(),
      votes: i.number(),
      quarter: i.string(), // Which quarter this reflection is for
      isPinned: i.boolean(), // Carry forward to OKR formation
      createdAt: i.number(),
    }),

    // Comments and notes on OKRs
    comments: i.entity({
      content: i.string(),
      author: i.string(),
      createdAt: i.number(),
      isResolved: i.boolean().optional(),
    }),

    // Actions/tasks related to OKRs
    actions: i.entity({
      title: i.string(),
      description: i.string().optional(),
      status: i.string(), // 'todo' | 'in-progress' | 'done' | 'blocked'
      owner: i.string(),
      dueDate: i.number().optional(),
      createdAt: i.number(),
      updatedAt: i.number(),
    }),

    // Risks and obstacles
    risks: i.entity({
      title: i.string(),
      description: i.string(),
      severity: i.string(), // 'low' | 'medium' | 'high' | 'critical'
      status: i.string(), // 'open' | 'mitigated' | 'resolved'
      owner: i.string(),
      createdAt: i.number(),
      updatedAt: i.number(),
    }),

    // Team members
    members: i.entity({
      name: i.string(),
      email: i.string(),
      avatar: i.string().optional(),
      role: i.string(), // 'member' | 'facilitator' | 'admin'
      isActive: i.boolean(),
      joinedAt: i.number(),
    }),

    // Activity feed entries
    activities: i.entity({
      type: i.string(), // 'created' | 'updated' | 'commented' | 'completed'
      description: i.string(),
      author: i.string(),
      timestamp: i.number(),
      metadata: i.json().optional(), // Flexible field for activity-specific data
    }),
  },
  {
    // Relationships
    okrKeyResults: {
      forward: { on: "okrs", has: "many", label: "keyResults" },
      reverse: { on: "keyResults", has: "one", label: "okr" },
    },
    okrComments: {
      forward: { on: "okrs", has: "many", label: "comments" },
      reverse: { on: "comments", has: "one", label: "okr" },
    },
    okrActions: {
      forward: { on: "okrs", has: "many", label: "actions" },
      reverse: { on: "actions", has: "one", label: "okr" },
    },
    okrRisks: {
      forward: { on: "okrs", has: "many", label: "risks" },
      reverse: { on: "risks", has: "one", label: "okr" },
    },
    keyResultComments: {
      forward: { on: "keyResults", has: "many", label: "comments" },
      reverse: { on: "comments", has: "one", label: "keyResult" },
    },
    okrActivities: {
      forward: { on: "okrs", has: "many", label: "activities" },
      reverse: { on: "activities", has: "one", label: "okr" },
    },
    activityComments: {
      forward: { on: "activities", has: "many", label: "comments" },
      reverse: { on: "comments", has: "one", label: "activity" },
    },
  }
);

export default graph;
