import React, { useState, useEffect } from 'react'
import { Member } from '../types'
import '../styles/main.css'

export default function TeamRegister() {
  const [members, setMembers] = useState<Member[]>([])
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  // Cargar miembros al inicio
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

  const addMember = async () => {
    if (!name.trim()) return
    setLoading(true)
    
    try {
      // @ts-ignore
      const result = await window.electronAPI.members.create({ name, role, email })
      
      // Recargar la lista de miembros
      await loadMembers()
      
      setName('')
      setRole('')
      setEmail('')
    } catch (err) {
      console.error('Error adding member:', err)
      alert('Error al agregar miembro')
    } finally {
      setLoading(false)
    }
  }

  const exportCsv = () => {
    const header = ['name', 'role', 'email']
    const rows = members.map(m => [m.name, m.role ?? '', m.email ?? ''])
    const csv = [header, ...rows]
      .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `team-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addMember()
    }
  }

  return (
    <div className="glass-card fade-in">
      <h3 className="text-xl font-semibold mb-6">Registro del Equipo</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ingresa el nombre"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rol
          </label>
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="input-field"
          >
            <option value="">Selecciona un rol</option>
            <option value="Developer">Desarrollador</option>
            <option value="Designer">Diseñador</option>
            <option value="Product Manager">Product Manager</option>
            <option value="QA Engineer">QA Engineer</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="correo@ejemplo.com"
            className="input-field"
          />
        </div>

        <div className="flex space-x-3">
          <button onClick={addMember} className="btn btn-primary flex-1">
            Agregar Miembro
          </button>
          <button onClick={exportCsv} className="btn btn-secondary">
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="mt-8">
        <h4 className="font-medium mb-4">Miembros del Equipo</h4>
        <div className="space-y-2">
          {members.map(m => (
            <div key={m.id} className="member-card">
              <div className="flex-1">
                <h5 className="font-medium">{m.name}</h5>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="badge badge-success">{m.role}</span>
                  <span className="text-sm text-gray-500">{m.email}</span>
                </div>
              </div>
              <button
                onClick={() => setMembers(members.filter(member => member.id !== m.id))}
                className="text-red-500 hover:text-red-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">
              No hay miembros registrados aún
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
