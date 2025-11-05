import React, { createContext, useReducer, useContext, ReactNode, useEffect } from 'react'
import { Project } from '../types'

type State = { projects: Project[]; loading: boolean }
type Action =
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'SET_LOADING'; payload: boolean }

const initialState: State = { projects: [], loading: false }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload }
    case 'ADD_PROJECT':
      return { ...state, projects: [action.payload, ...state.projects] }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    default:
      return state
  }
}

const ProjectContext = createContext<{ state: State; dispatch: React.Dispatch<Action> } | undefined>(undefined)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    ;(async () => {
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        // @ts-ignore
        const projects = await window.electronAPI.projects.getAll()
        dispatch({ type: 'SET_PROJECTS', payload: projects || [] })
      } catch (err) {
        console.error('Error fetching projects', err)
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    })()
  }, [])

  return <ProjectContext.Provider value={{ state, dispatch }}>{children}</ProjectContext.Provider>
}

export function useProject() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject must be used within ProjectProvider')
  return ctx
}
