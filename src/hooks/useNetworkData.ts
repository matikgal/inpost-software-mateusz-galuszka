import { useEffect, useReducer, useRef } from 'react'
import { fetchAllPages } from '../api/inpostApi'
import type { InPostPoint } from '../types/inpost'

const CACHE_KEY = 'inpost_points_v1'

function loadCache(): InPostPoint[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as InPostPoint[]
  } catch {
    return null
  }
}

function saveCache(points: InPostPoint[]): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(points))
  } catch {
    // sessionStorage full — skip
  }
}

interface State {
  status: 'idle' | 'loading' | 'success' | 'error'
  points: InPostPoint[]
  loaded: number
  total: number
  error: string | null
}

type Action =
  | { type: 'FETCH_START' }
  | { type: 'PROGRESS'; loaded: number; total: number }
  | { type: 'FETCH_SUCCESS'; points: InPostPoint[] }
  | { type: 'FETCH_ERROR'; error: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, status: 'loading', loaded: 0, total: 0, error: null }
    case 'PROGRESS':
      return { ...state, loaded: action.loaded, total: action.total }
    case 'FETCH_SUCCESS':
      return { ...state, status: 'success', points: action.points, loaded: action.points.length }
    case 'FETCH_ERROR':
      return { ...state, status: 'error', error: action.error }
    default:
      return state
  }
}

const initial: State = { status: 'idle', points: [], loaded: 0, total: 0, error: null }

export function useNetworkData() {
  const [state, dispatch] = useReducer(reducer, initial)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const cached = loadCache()
    if (cached) {
      dispatch({ type: 'FETCH_SUCCESS', points: cached })
      return
    }

    const ctrl = new AbortController()
    abortRef.current = ctrl

    dispatch({ type: 'FETCH_START' })

    fetchAllPages(
      1000,
      5,
      (loaded, total) => dispatch({ type: 'PROGRESS', loaded, total }),
      ctrl.signal
    )
      .then((points) => {
        saveCache(points)
        dispatch({ type: 'FETCH_SUCCESS', points })
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return
        dispatch({
          type: 'FETCH_ERROR',
          error: err instanceof Error ? err.message : String(err),
        })
      })

    return () => ctrl.abort()
  }, [])

  return state
}
