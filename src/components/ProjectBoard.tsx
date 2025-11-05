import React, { useState } from 'react'
import { useProject } from '../store/ProjectContext'
import BudgetViewer from './BudgetViewer'
import { Project } from '../types'

export default function ProjectBoard() {
  const { state, dispatch } = useProject()
  const [name, setName] = useState('')
  const [budget, setBudget] = useState<number>(0)
  const [selected, setSelected] = useState<Project | null>(null)

  const create = async () => {
    if (!name.trim()) return
    try {
      // @ts-ignore
      const res = await window.electronAPI.projects.create({ name, description: '', budget })
      const newProject: Project = { id: res.id, name, description: '', budget }
      dispatch({ type: 'ADD_PROJECT', payload: newProject })
      setName('')
      setBudget(0)
    } catch (err) {
      console.error('Error creating project', err)
    }
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Projects</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project name"
          style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ddd' }}
        />
        <input
          type="number"
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          placeholder="Budget"
          style={{ width: 120, padding: 8, borderRadius: 6, border: '1px solid #ddd' }}
        />
        <button onClick={create} style={{ padding: '8px 12px', borderRadius: 6 }}>Create</button>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {state.projects.map((p) => (
          <div key={p.id} style={{ padding: 12, background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{p.name}</strong>
                <div style={{ fontSize: 13, color: '#555' }}>
                  Budget: ${p.budget ?? 0} | ID: {p.id}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => {
                  console.log('Seleccionando proyecto:', p)
                  setSelected(p)
                }}>Open</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div style={{ marginTop: 16 }}>
          <BudgetViewer project={selected} onClose={() => setSelected(null)} />
        </div>
      )}
    </div>
  )
}
