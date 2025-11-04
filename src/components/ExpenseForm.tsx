import React, { useState, useEffect } from 'react'
import { Member } from '../types'

export default function ExpenseForm({ onAdd }: { onAdd: (amount: number, description?: string, memberId?: number) => void }) {
  const [amount, setAmount] = useState<number>(0)
  const [description, setDescription] = useState('')
  const [memberId, setMemberId] = useState<number | undefined>(undefined)
  const [members, setMembers] = useState<Member[]>([])

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    try {
      // @ts-ignore
      const data = await window.electronAPI.members.getAll()
      setMembers(data || [])
    } catch (err) {
      console.error('Error loading members:', err)
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || amount <= 0) return
    onAdd(amount, description, memberId)
    setAmount(0)
    setDescription('')
    setMemberId(undefined)
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
      <input 
        type="number" 
        value={amount} 
        onChange={e => setAmount(Number(e.target.value))} 
        placeholder="Monto" 
        style={{ padding: 8, borderRadius: 6, minWidth: '100px' }} 
      />
      <input 
        value={description} 
        onChange={e => setDescription(e.target.value)} 
        placeholder="Descripción" 
        style={{ padding: 8, borderRadius: 6, flex: 1, minWidth: '150px' }} 
      />
      <select 
        value={memberId || ''} 
        onChange={e => setMemberId(e.target.value ? Number(e.target.value) : undefined)}
        style={{ padding: 8, borderRadius: 6, minWidth: '150px' }}
      >
        <option value="">Seleccionar miembro</option>
        {members.map(member => (
          <option key={member.id} value={member.id}>{member.name} - {member.role}</option>
        ))}
      </select>
      <button type="submit" style={{ padding: '8px 12px', borderRadius: 6 }}>Agregar</button>
    </form>
  )
}
