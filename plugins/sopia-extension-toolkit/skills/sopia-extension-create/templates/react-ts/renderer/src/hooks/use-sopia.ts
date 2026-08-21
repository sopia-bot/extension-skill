import { useCallback, useEffect, useRef } from 'react'

export function useSopia() {
  const emit = useCallback((event: string, ...args: unknown[]) => {
    window.$sopia?.emit(event, ...args)
  }, [])

  return {
    emit,
    isReady: Boolean(window.$sopia)
  }
}

export function useSopiaEvent<T = unknown>(event: string, handler: (data: T) => void) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    const bridge = window.$sopia
    if (!bridge) return

    const eventHandler = (data: unknown) => {
      handlerRef.current(data as T)
    }

    bridge.on(event, eventHandler)
    return () => {
      bridge.off(event, eventHandler)
    }
  }, [event])
}

export function useSopiaRequest<TRequest = void, TResponse = unknown>(
  requestEvent: string,
  responseEvent: string,
  timeoutMs = 5000
) {
  return useCallback((data?: TRequest): Promise<TResponse> => {
    const bridge = window.$sopia
    if (!bridge) return Promise.reject(new Error('SOPIA bridge is unavailable'))

    return new Promise<TResponse>((resolve, reject) => {
      let settled = false

      const cleanup = () => {
        bridge.off(responseEvent, handleResponse)
        clearTimeout(timer)
      }
      const handleResponse = (response: unknown) => {
        if (settled) return
        settled = true
        cleanup()
        resolve(response as TResponse)
      }
      const timer = setTimeout(() => {
        if (settled) return
        settled = true
        cleanup()
        reject(new Error('SOPIA request timed out'))
      }, timeoutMs)

      bridge.on(responseEvent, handleResponse)
      bridge.emit(requestEvent, data)
    })
  }, [requestEvent, responseEvent, timeoutMs])
}
