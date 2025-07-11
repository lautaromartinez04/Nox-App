// src/components/routers/gastos/Gastos.jsx

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)
const API_URL = import.meta.env.VITE_API_URL

export const Gastos = () => {
  const [gastos, setGastos] = useState([])
  const [usuariosMap, setUsuariosMap] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [error, setError] = useState('')

  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  // Fetch usuarios to map ID -> nombre
  useEffect(() => {
    fetch(`${API_URL}/usuarios`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : Promise.reject('Error cargando usuarios'))
      .then(data => {
        const map = {}
        data.forEach(u => { map[u.id] = u.nombre })
        setUsuariosMap(map)
      })
      .catch(console.error)
  }, [token])

  // Fetch gastos
  const fetchGastos = () => {
    fetch(`${API_URL}/gastos`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : Promise.reject('Error cargando gastos'))
      .then(data => setGastos(data))
      .catch(err => setError(err.message))
  }
  useEffect(fetchGastos, [token])

  // Compute filtered list
  const filtered = gastos.filter(g => {
    const term = searchTerm.toLowerCase()
    const usuario = usuariosMap[g.usuario_id] || ''
    const matchesSearch =
      g.id.toString().includes(term) ||
      (g.descripcion ?? '').toLowerCase().includes(term) ||
      usuario.toLowerCase().includes(term)
    let inRange = true
    const fecha = new Date(g.fecha)
    if (dateFrom) inRange = inRange && fecha >= new Date(dateFrom)
    if (dateTo)   inRange = inRange && fecha <= new Date(dateTo)
    return matchesSearch && inRange
  })

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize) || 1
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="p-6 overflow-x-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-extrabold text-[#5170FF]">Gastos</h1>
        <button
          onClick={() => navigate('/gastos/nuevo')}
          className="flex items-center gap-2 bg-[#5170FF] text-white px-4 py-2 rounded-md hover:bg-[#3f5be0] transition text-lexend-medium"
        >
          <FontAwesomeIcon icon={faPlus} /> Agregar
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm">Buscar ID/Descripción/Usuario:</label>
          <input
            type="text"
            placeholder="Ej: 123 o pago servicios"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setPage(1) }}
            className="mt-1 p-2 border rounded w-full"
          />
        </div>
        <div>
          <label className="block text-sm">Desde:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(1) }}
            className="mt-1 p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm">Hasta:</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(1) }}
            className="mt-1 p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm">Filas por página:</label>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
            className="mt-1 p-2 border rounded"
          >
            {[10,20,50,100].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <table className="min-w-full bg-white rounded-lg shadow">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="px-4 py-2 text-left">ID</th>
            <th className="px-4 py-2 text-left">Fecha</th>
            <th className="px-4 py-2 text-left">Monto</th>
            <th className="px-4 py-2 text-left">Descripción</th>
            <th className="px-4 py-2 text-left">Usuario</th>
            <th className="px-4 py-2 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map(g => (
            <tr key={g.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2">{g.id}</td>
              <td className="px-4 py-2">{new Date(g.fecha).toLocaleString()}</td>
              <td className="px-4 py-2">${g.monto.toFixed(2)}</td>
              <td className="px-4 py-2">{g.descripcion || '—'}</td>
              <td className="px-4 py-2">{usuariosMap[g.usuario_id] ?? `#${g.usuario_id}`}</td>
              <td className="px-4 py-2">
                <button
                  onClick={() => navigate(`/gastos/${g.id}`)}
                  className="text-[#5170FF] hover:underline text-lexend-medium transition"
                >Ver</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm">Página {page} de {totalPages} (Total {filtered.length})</span>
        <div className="space-x-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >Anterior</button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >Siguiente</button>
        </div>
      </div>
    </div>
  )
}