export interface SopiaRendererAPI {
  emit(event: string, ...args: unknown[]): void
  on(event: string, handler: (...args: unknown[]) => void): void
  off(event: string, handler: (...args: unknown[]) => void): void
  once(event: string, handler: (...args: unknown[]) => void): void
  removeAllListeners(event?: string): void
}

declare global {
  interface Window {
    $sopia?: SopiaRendererAPI
  }
}
