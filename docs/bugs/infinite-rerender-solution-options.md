# Infinite Re-render Loop - Solution Options

## Current Status

After extensive debugging, we've identified that `UserPreferencesContext` is the culprit. The issue is that it creates a new context value on every render, causing consumers to re-render infinitely.

## Root Cause

React Context + useCallback/useMemo with complex dependency chains creates a fragile system where:

1. Storage changes → callbacks change → context value changes → consumers re-render
2. Re-render → context provider re-renders → creates new callbacks → loop continues

## Three Options Forward

### Option 1: Remove UserPreferencesProvider Context (FASTEST - 15 min)

**What**: Don't use context at all for preferences. Just read from storage directly in components.

**Implementation**:

```tsx
// Instead of context, export utility functions
export function useUserPreferences() {
  const { storage } = useHelpActions();
  // Return stable functions that read from storage directly
  return useMemo(
    () => ({
      addBookmark: (id: string) => {
        /* read/write storage */
      },
      // ... etc
    }),
    [storage],
  );
}
```

**Pros**:

- Simple, no context complexity
- Will definitely work
- Minimal code changes

**Cons**:

- Components will re-render when storage changes (acceptable)
- Less "React-y" architecture

### Option 2: Use State Management Library (BEST - 1-2 hours)

**What**: Replace context with Zustand (tiny, ~1KB)

**Implementation**:

```tsx
import create from 'zustand';

const usePreferencesStore = create((set, get) => ({
  bookmarks: [],
  addBookmark: (id) =>
    set((state) => ({
      bookmarks: [...state.bookmarks, id],
    })),
  // Zustand handles all the stability/memoization automatically
}));
```

**Pros**:

- Designed to solve exactly this problem
- No re-render issues
- Better performance
- Industry standard solution

**Cons**:

- Adds dependency (though tiny)
- Requires refactoring existing code

### Option 3: Fix Current Context (UNCERTAIN - unknown time)

**What**: Continue debugging and fixing the current React Context approach

**Implementation**:

- Add `eslint-disable` to every callback
- Ensure all refs are used correctly
- Hope no other edge cases exist

**Pros**:

- No new dependencies
- "Pure React" solution

**Cons**:

- **We've tried this multiple times and it keeps failing**
- Fragile - easy to break with future changes
- Hard to maintain
- No guarantee it will work

## Recommendation

**For immediate fix**: Option 1 (remove context)
**For long-term**: Option 2 (Zustand)

The current context-based approach is fighting React's design. We need to either simplify drastically (Option 1) or use a tool designed for this (Option 2).

## Decision Needed

Which approach do you want to take?
