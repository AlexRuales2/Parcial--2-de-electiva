import React, { useEffect, useState } from 'react'
import { Project, Expense } from '../types'
import ExpenseForm from './ExpenseForm'

export default function BudgetViewer({ project, onClose }: { project: Project; onClose: () => void }) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        // @ts-ignore
        const data = await window.electronAPI.budget.getExpenses(project.id)
        setExpenses(data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    })()
  }, [project.id])

  useEffect(() => {
    setTotal(expenses.reduce((s, e) => s + (e.amount || 0), 0))
  }, [expenses])

  const addExpense = async (amount: number, description?: string, memberId?: number) => {
    try {
      // @ts-ignore
      const res = await window.electronAPI.budget.addExpense({ projectId: project.id, memberId, amount, description })
      // Recargar la lista de gastos para obtener los datos actualizados con información del miembro
      // @ts-ignore
      const data = await window.electronAPI.budget.getExpenses(project.id)
      setExpenses(data || [])
    } catch (err) {
      console.error(err)
      alert('Error al agregar gasto')
    }
  }

  const generatePdf = async () => {
    try {
      console.log('Generando PDF para proyecto:', project)
      console.log('Project ID:', project.id)
      
      if (!project.id || project.id <= 0) {
        alert('Error: ID del proyecto no válido')
        return
      }
      
      // @ts-ignore
      const path = await window.electronAPI.report.generateBudgetPdf(project.id)
      alert(`PDF generado en: ${path}`)
    } catch (err) {
      console.error('Error generando PDF:', err)
      alert('Error generando PDF: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  return (
    <div style={{ padding: 12, background: '#fff', borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>{project.name}</h3>
        <div>
          <button onClick={generatePdf} style={{ marginRight: 8 }}>Export PDF</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <div>Budget initial: ${project.budget ?? 0}</div>
        <div>Total expenses: ${total}</div>
        <div>Remaining: ${ (project.budget ?? 0) - total }</div>
      </div>

      <hr />

      <ExpenseForm onAdd={addExpense} />

      <div style={{ marginTop: 12 }}>
        <h4>Gastos</h4>
        {loading ? <div>Loading...</div> : (
          <ul>
            {expenses.map(e => (
              <li key={e.id} style={{ marginBottom: 8, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                <div><strong>{e.incurred_at?.slice(0,10)}</strong> — {e.description} — <strong>${e.amount}</strong></div>
                {e.member_name && (
                  <div style={{ fontSize: '0.9em', color: '#666', marginTop: 4 }}>
                    Realizado por: {e.member_name} {e.member_role && `(${e.member_role})`}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
