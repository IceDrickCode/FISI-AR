export const initialState = () => ({ phase: 'idle', tracked: false, activeIndex: null });
export function transition(state, input) {
  const event = typeof input === 'string' ? { type: input } : input;
  switch (event.type) {
    case 'start': return state.phase === 'idle' ? { phase: 'starting', tracked: false, activeIndex: null } : state;
    case 'ready': return state.phase === 'starting' ? { phase: 'scanning', tracked: false, activeIndex: null } : state;
    case 'found': return ['scanning', 'found', 'lost'].includes(state.phase) && Number.isInteger(event.index) && event.index >= 0
      ? { phase: 'found', tracked: true, activeIndex: event.index } : state;
    case 'lost': return state.tracked && event.index === state.activeIndex ? { ...state, phase: 'lost', tracked: false } : state;
    case 'stop': return initialState();
    case 'error': return { phase: 'error', tracked: false, activeIndex: null };
    default: return state;
  }
}
