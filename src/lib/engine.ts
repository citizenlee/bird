export type EngineMode = 'graphql' | 'sweetistics' | 'auto';

export function resolveEngineMode(value?: string): EngineMode {
  const normalized = (value || 'auto').toLowerCase();
  if (normalized === 'graphql' || normalized === 'sweetistics' || normalized === 'auto') {
    return normalized;
  }
  return 'auto';
}

export function shouldUseSweetistics(engine: EngineMode, _hasApiKey: boolean): boolean {
  if (engine === 'sweetistics') return true;
  if (engine === 'graphql') return false;
  return false; // auto: GraphQL primary, Sweetistics only as fallback
}
