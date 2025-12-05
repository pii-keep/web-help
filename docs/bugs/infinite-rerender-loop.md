# Bug: Infinite Re-render Loop in Chrome

**Status:** Open  
**Priority:** High  
**Date Reported:** 2025-12-05

## Description

The application experiences an infinite re-render loop when opened in Chrome browser, resulting in "Maximum update depth exceeded" React error. The issue appears to be browser-specific (does not occur in VS Code's Simple Browser consistently).

## Symptoms

- Console error: "Maximum update depth exceeded"
- Application becomes unresponsive
- React DevTools shows continuous re-renders
- CPU usage spikes

## Root Cause Analysis

The issue is related to the React context pattern in `HelpContext.tsx`:

1. **Context Value Recreation**: The `HelpContextValue` object includes `state` in its `useMemo` dependencies, causing the context to update on every state change
2. **Callback Dependency Chain**: When state changes → context updates → callbacks are considered "changed" by React → components with those callbacks in useEffect dependencies re-run → state changes again
3. **Specific Trigger**: `HelpPage.tsx` has a useEffect that depends on `loadArticle` callback (now fixed with eslint-disable)

## Attempted Fixes

### What Was Tried

1. ✅ Added `useMemo` to wrap context value
2. ✅ Used refs for `config` and `callbacks` to prevent unnecessary updates
3. ✅ Added `stateRef` to allow callbacks to access current state without dependency
4. ✅ Removed `state.currentArticle?.id` from `navigateToArticle` dependencies
5. ⚠️ Disabled exhaustive-deps lint rule in `HelpPage.tsx` useEffect - **NOT A PROPER FIX**

### Why They Don't Fully Work

The core issue is architectural:

- React Context with reducer pattern inherently causes re-renders when state changes
- Callbacks that depend on state create circular dependencies
- Components consuming the context re-render on every state change
- Some of those components have effects that trigger more state changes

## Proper Solution Needed

The library needs a **context splitting pattern**:

```tsx
// Pattern 1: Split into two contexts
<HelpStateContext.Provider value={state}>
  <HelpActionsContext.Provider value={actions}>
    {children}
  </HelpActionsContext.Provider>
</HelpStateContext.Provider>

// Pattern 2: Use a state management library
// - Zustand
// - Jotai
// - Redux Toolkit

// Pattern 3: Use event emitters instead of callbacks in useEffect
```

## Workaround for Now

The current "fix" uses `eslint-disable-next-line react-hooks/exhaustive-deps` to suppress the warning about missing dependencies. This prevents the infinite loop but:

- Violates React best practices
- Could lead to stale closures
- Makes the code harder to maintain

## Reproduction Steps

1. Run `npm run dev` in `examples/with-cli`
2. Open http://localhost:5173/ in Chrome
3. Open DevTools console
4. Observe "Maximum update depth exceeded" errors (may be intermittent)

## Related Files

- `/src/core/context/HelpContext.tsx` - Main context provider
- `/src/core/components/HelpPage.tsx` - Component with problematic useEffect
- `/src/core/components/HelpNavigation.tsx` - Navigation component

## Next Steps

1. [ ] Research React Context best practices for this use case
2. [ ] Evaluate state management libraries (Zustand recommended for small bundle size)
3. [ ] Consider splitting context into state + actions
4. [ ] Add integration tests that detect infinite loops
5. [ ] Review all components that use `useHelpContext()` for similar issues

## References

- [React Beta Docs: Separating state and actions contexts](https://react.dev/learn/scaling-up-with-reducer-and-context#moving-all-wiring-into-a-single-file)
- [Kent C. Dodds: How to use React Context effectively](https://kentcdodds.com/blog/how-to-use-react-context-effectively)
- [React Hook Form: Performance optimization](https://react-hook-form.com/advanced-usage#FormProviderPerformance)

---

## Code Review Comments (2025-12-05)

### Comment 1: Primary Issue in HelpContext.tsx (Lines 353-377)

**Location:** `/src/core/context/HelpContext.tsx` lines 353-377

**Issue:** The `useMemo` for the context value has `state` as a dependency, which means the entire context value object changes on every state update:

```tsx
const value: HelpContextValue = useMemo(
  () => ({
    state,  // <-- This causes context value to change on every state update
    // ...
  }),
  [
    state,  // <-- Primary culprit
    // ...
  ],
);
```

**Fix Required:** Split the context into two separate contexts:
1. `HelpStateContext` - for reactive state (read-only, will cause re-renders)
2. `HelpActionsContext` - for stable action functions (memoized, won't change)

This pattern is documented in React's official docs and prevents unnecessary re-renders in components that only need actions.

---

### Comment 2: Circular Dependency in HelpPage.tsx (Lines 92-97)

**Location:** `/src/core/components/HelpPage.tsx` lines 92-97

**Issue:** The useEffect uses `eslint-disable-next-line` to suppress a legitimate warning:

```tsx
useEffect(() => {
  if (articleId && !article) {
    loadArticle(articleId);  // <-- loadArticle changes when context changes
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [articleId, article]);
```

**Why This Is Dangerous:**
- `loadArticle` is derived from context and changes on state updates
- If included in deps, it would cause: state change → context update → loadArticle changes → useEffect runs → state change (loop)
- The eslint-disable is a bandaid, not a fix

**Fix Required:** Once context is split, `loadArticle` should come from `useHelpActions()` and be stable (referentially equal between renders).

---

### Comment 3: useHelpNavigation Hook Has State Dependencies in Callbacks (Lines 49-59)

**Location:** `/src/core/hooks/useHelpNavigation.ts` lines 49-59

**Issue:** The `goToPrev` and `goToNext` callbacks depend on `state.navigation`:

```tsx
const goToPrev = useCallback(async () => {
  if (state.navigation.prev) {
    await navigateToArticle(state.navigation.prev.id);
  }
}, [navigateToArticle, state.navigation.prev]);  // <-- state dependency
```

**Problem:** These callbacks will have new references whenever navigation state changes, which can cause re-renders in components that use them as dependencies.

**Fix Required:** Access navigation state inside the callback via a ref or the actions context pattern. Example:

```tsx
const goToPrev = useCallback(async () => {
  const nav = stateRef.current.navigation;  // Use ref instead
  if (nav.prev) {
    await navigateToArticle(nav.prev.id);
  }
}, [navigateToArticle]);  // Stable dependencies only
```

---

### Comment 4: useHelpSearch Hook Has Callbacks Dependency (Lines 178-202)

**Location:** `/src/core/hooks/useHelpSearch.ts` lines 178-202

**Issue:** The `performSearch` callback depends on `callbacks`:

```tsx
const performSearch = useCallback(
  async (searchQuery: string): Promise<HelpSearchResult[]> => {
    // ...
    callbacks.onSearch?.(searchQuery, searchResults);  // <-- Uses callbacks
    // ...
  },
  [contentIndex, mergedOptions, callbacks],  // <-- callbacks in deps
);
```

**Problem:** `callbacks` is currently passed from the context value, which changes on every state update. This causes `performSearch` to be recreated, which then cascades to the debounced search effect (lines 205-230).

**Fix Required:** 
- Access callbacks via `callbacksRef.current` pattern (already exists in HelpContext but not exposed)
- Or move callback invocation outside the memoized function

---

### Comment 5: useHelpSearch Effect Creates Potential Loop (Lines 205-230)

**Location:** `/src/core/hooks/useHelpSearch.ts` lines 205-230

**Issue:** The debounced search effect has `performSearch` as a dependency:

```tsx
useEffect(() => {
  // ...
  debounceRef.current = setTimeout(async () => {
    const searchResults = await performSearch(query);
    setResults(searchResults);
  }, mergedOptions.debounceMs);
  // ...
}, [
  query,
  mergedOptions.debounceMs,
  mergedOptions.minQueryLength,
  performSearch,  // <-- Changes when callbacks change (every state update)
]);
```

**Problem:** When `performSearch` changes (due to callbacks dependency), this effect runs. If the search triggers any state update in HelpContext, it creates a cycle.

**Fix Required:** Make `performSearch` stable by removing unstable dependencies. Use refs for callback access.

---

### Comment 6: HelpSearch Component Uses Unstable Context Values (Lines 48-52)

**Location:** `/src/core/components/navigation/HelpSearch.tsx` lines 48-52

**Issue:** The component indirectly depends on context state via `getRecentSearches`:

```tsx
const recentSearches = useMemo(
  () => (showRecent ? getRecentSearches() : []),
  [showRecent, getRecentSearches],  // <-- getRecentSearches may be unstable
);
```

**Observation:** The `getRecentSearches` function from `UserPreferencesContext` depends on `storage` (line 301-303 in UserPreferencesContext.tsx), which is stable. This is OK.

However, the `useHelpSearch` hook's `callbacks` issue can still cause problems here.

---

### Comment 7: navigationItems useMemo in HelpPage Has contentLoader Dependency (Lines 63-89)

**Location:** `/src/core/components/HelpPage.tsx` lines 63-89

**Issue:** The `navigationItems` useMemo depends on `contentLoader`:

```tsx
const navigationItems = useMemo((): NavigationItem[] => {
  // ...
  const categoryArticles = contentLoader.getAllArticles()  // <-- Uses contentLoader
  // ...
}, [state.categories, contentLoader]);  // <-- contentLoader in deps
```

**Observation:** `contentLoader` is currently stable (initialized via ref in HelpContext lines 198-204). This is NOT an issue.

However, `state.categories` is reactive and will cause this memo to recalculate whenever categories change.

**Note:** This is expected behavior and not a problem, but worth documenting.

---

### Comment 8: UserPreferencesContext Has Unstable callbacks Dependency (Lines 142-156)

**Location:** `/src/core/context/UserPreferencesContext.tsx` lines 142-156

**Issue:** The `addBookmark` callback depends on `callbacks`:

```tsx
const addBookmark = useCallback(
  (articleId: string) => {
    // ...
    callbacks.onBookmark?.(articleId, true);  // <-- Uses callbacks
  },
  [storage, callbacks],  // <-- callbacks in deps
);
```

**Problem:** `callbacks` comes from `useHelpContext()` (line 111), which returns the entire context value. When HelpContext state changes, callbacks reference changes, causing `addBookmark` to be recreated.

**Fix Required:** 
- Either expose `callbacksRef` from HelpContext
- Or use the split context pattern so actions don't depend on the state context

---

### Comment 9: Missing stateRef Export from HelpContext

**Location:** `/src/core/context/HelpContext.tsx` lines 172-175

**Issue:** A `stateRef` is created for internal use:

```tsx
const stateRef = useRef(state);
useEffect(() => {
  stateRef.current = state;
}, [state]);
```

**Observation:** This ref is used internally by `navigateToArticle` (line 289) but is NOT exposed to consuming hooks.

**Fix Required:** Consider exposing a `getState()` function or the ref itself so hooks like `useHelpNavigation` can access current state without adding state to their dependencies.

---

### Comment 10: Recommended Architectural Changes

Based on the end-to-end code evaluation, here are the recommended changes in priority order:

#### Priority 1: Split HelpContext into State and Actions contexts

**Files to modify:** `/src/core/context/HelpContext.tsx`

```tsx
// Create two contexts
const HelpStateContext = createContext<HelpState | null>(null);
const HelpActionsContext = createContext<HelpActions | null>(null);

// Separate hooks
export function useHelpState(): HelpState { /* ... */ }
export function useHelpActions(): HelpActions { /* ... */ }

// Keep useHelpContext for backward compatibility
export function useHelpContext(): HelpContextValue {
  return { state: useHelpState(), ...useHelpActions() };
}
```

#### Priority 2: Stabilize all action callbacks

**Files to modify:** 
- `/src/core/context/HelpContext.tsx`
- `/src/core/hooks/useHelpNavigation.ts`
- `/src/core/hooks/useHelpSearch.ts`

All callbacks should:
- Not depend on `state` directly
- Use refs to access current state when needed
- Not depend on `callbacks` prop directly (use `callbacksRef.current`)

#### Priority 3: Remove eslint-disable comments

**Files to modify:**
- `/src/core/components/HelpPage.tsx` (line 96)
- `/src/core/context/HelpContext.tsx` (line 259)

After implementing the split context pattern, these eslint-disable comments should be safely removable.

#### Priority 4: Add render count tests

**New file:** `/src/__tests__/render-loop.test.tsx`

Create tests that count renders and fail if excessive re-renders occur:

```tsx
test('HelpPage does not re-render infinitely on mount', () => {
  const renderCount = { current: 0 };
  
  function Counter() {
    renderCount.current++;
    return <HelpPage />;
  }
  
  render(
    <HelpProvider>
      <Counter />
    </HelpProvider>
  );
  
  expect(renderCount.current).toBeLessThan(5);
});
```

---

### Summary of All Files Requiring Changes

| File | Issue | Priority |
|------|-------|----------|
| `/src/core/context/HelpContext.tsx` | Split into state/actions contexts | P1 |
| `/src/core/context/HelpContext.tsx` | Expose stateRef or getState() | P2 |
| `/src/core/hooks/useHelpNavigation.ts` | Remove state deps from callbacks | P2 |
| `/src/core/hooks/useHelpSearch.ts` | Remove callbacks dep from performSearch | P2 |
| `/src/core/context/UserPreferencesContext.tsx` | Access callbacks via ref | P2 |
| `/src/core/components/HelpPage.tsx` | Remove eslint-disable after fix | P3 |
