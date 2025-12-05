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
