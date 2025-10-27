# InstantDB Best Practices for OKR Dashboard

## ALWAYS Read This Before Writing InstantDB Code

This document contains critical patterns and anti-patterns for working with InstantDB in the OKR Dashboard.

## Schema Changes

**DO:**
- Update `instant.schema.ts` first
- Run `bunx instant-cli push` to deploy schema changes
- Test queries locally before deploying

**DON'T:**
- Manually edit data structure in the dashboard
- Skip schema versioning
- Make breaking changes without migration plan

## Queries

**DO:**
- Use the typed `db.useQuery()` hook from `@/lib/instant`
- Specify exact relationships you need
- Use `$` for filters and sorting
- Handle loading and error states

```tsx
const { data, isLoading, error } = db.useQuery({
  okrs: {
    keyResults: {},
    comments: {},
    $: {
      where: { quarter: "2025-Q1", status: "active" },
      order: { serverCreatedAt: "desc" },
    },
  },
});
```

**DON'T:**
- Over-fetch data (only query what you need)
- Forget to handle loading/error states
- Use magic strings for status values (use constants)

## Mutations

**DO:**
- Use optimistic updates for instant UI feedback
- Provide transaction IDs for related mutations
- Validate data before mutation

```tsx
db.transact([
  db.tx.okrs[okrId].update({ status: "active" }),
  db.tx.activities[db.id()].update({
    type: "updated",
    description: `OKR activated`,
    author: currentUser,
    timestamp: Date.now(),
  }),
]);
```

**DON'T:**
- Mutate without user context
- Skip activity logging for important changes
- Use raw IDs (use `db.id()` for new entities)

## Real-time Collaboration

**DO:**
- Use presence for showing active users
- Debounce frequent updates (typing, dragging)
- Show optimistic updates immediately

**DON'T:**
- Block UI waiting for server confirmation
- Spam mutations (batch when possible)
- Forget to clean up presence on unmount

## Permissions (Future)

**DO:**
- Define permissions in InstantDB dashboard
- Test with different user roles
- Fail gracefully when permission denied

**DON'T:**
- Trust client-side permission checks alone
- Expose sensitive data in queries

## Performance

**DO:**
- Use pagination for large lists
- Lazy-load detail views
- Cache static data (members, quarters)

**DON'T:**
- Query all data on every render
- Skip memo/useMemo for expensive computations
- Load full activity history upfront

## Common Patterns

### Creating an OKR with Key Results

```tsx
const createOKR = (title: string, keyResults: string[]) => {
  const okrId = db.id();
  const now = Date.now();

  db.transact([
    db.tx.okrs[okrId].update({
      title,
      quarter: getCurrentQuarter(),
      status: OKRStatus.DRAFT,
      createdAt: now,
      updatedAt: now,
      createdBy: currentUser,
    }),
    ...keyResults.map((kr) =>
      db.tx.keyResults[db.id()].update({
        description: kr,
        target: 100,
        current: 0,
        unit: "%",
        status: "on-track",
        owner: currentUser,
        createdAt: now,
        updatedAt: now,
      }).link({ okr: okrId })
    ),
  ]);
};
```

### Updating Progress

```tsx
const updateKeyResult = (krId: string, current: number) => {
  const now = Date.now();

  db.transact([
    db.tx.keyResults[krId].update({
      current,
      updatedAt: now,
    }),
    db.tx.activities[db.id()].update({
      type: "updated",
      description: `Progress updated to ${current}`,
      author: currentUser,
      timestamp: now,
    }),
  ]);
};
```

### Adding Comments

```tsx
const addComment = (okrId: string, content: string) => {
  const commentId = db.id();

  db.transact([
    db.tx.comments[commentId].update({
      content,
      author: currentUser,
      createdAt: Date.now(),
      isResolved: false,
    }).link({ okr: okrId }),
  ]);
};
```

## Error Handling

**DO:**
```tsx
const { data, isLoading, error } = db.useQuery({ okrs: {} });

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!data?.okrs) return <EmptyState />;

// Now safely use data
```

**DON'T:**
```tsx
const { data } = db.useQuery({ okrs: {} });
// Oops! data.okrs might be undefined, causing crashes
return <div>{data.okrs.map(...)}</div>;
```

## Testing

- Test optimistic updates feel instant
- Test offline behavior (IndexedDB persistence)
- Test concurrent edits from multiple users
- Test with slow network (DevTools throttling)

## Resources

- InstantDB Docs: https://instantdb.com/docs
- Schema Reference: `instant.schema.ts`
- Type Exports: `@/lib/instant.ts`
