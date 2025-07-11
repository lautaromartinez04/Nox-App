// src/components/routers/ventas/Ventas.jsx

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL

export const Ventas = () => {
  const [ventas, setVentas] = useState([])
  const [clientesMap, setClientesMap] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  // 1) Carga clientes
  useEffect(() => {
    fetch(`${API_URL}/clientes`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : Promise.reject('Error clientes'))
      .then(data => {
        const map = {}
        data.forEach(c => { map[c.id] = c.nombre })
        setClientesMap(map)
      })
      .catch(console.error)
  }, [token])

  // 2) Carga ventas
  const fetchVentas = () => {
    fetch(`${API_URL}/ventas`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : Promise.reject('Error ventas'))
      .then(setVentas)
      .catch(console.error)
  }
  useEffect(fetchVentas, [token])

  // 3) WS para nuevas ventas
  useEffect(() => {
    const ws = new WebSocket(
      `${API_URL.replace(/^http/, 'ws')}/ws/ventas?token=${encodeURIComponent(token)}`
    )
    ws.onmessage = ({ data }) => {
      const msg = JSON.parse(data)
      if (msg.event === 'new_sale') fetchVentas()
    }
    return () => ws.close()
  }, [token])

  // Filtros
  const filtered = ventas.filter(v => {
    // busca por ID o nombre de cliente
    const cliente = clientesMap[v.cliente_id] || ''
    const matchesSearch = v.id.toString().includes(searchTerm)
      || cliente.toLowerCase().includes(searchTerm.toLowerCase())
    // filtra por fecha
    let inRange = true
    const fecha = new Date(v.fecha)
    if (dateFrom) inRange = inRange && fecha >= new Date(dateFrom)
    if (dateTo)   inRange = inRange && fecha <= new Date(dateTo)
    return matchesSearch && inRange
  })

  // Paginación
  const totalPages = Math.ceil(filtered.length / pageSize) || 1
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="p-6 overflow-x-auto">
      {/* Controles de filtro */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
        <div>
          <label className="block text-sm">Buscar ID/Cliente:</label>
          <input
            type="text"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setPage(1) }}
            className="mt-1 p-2 border rounded w-full"
            placeholder="Nombre o ID de venta"
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

      {/* Tabla de ventas */}
      <table className="min-w-full bg-white rounded-lg shadow">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="px-4 py-2 text-left">ID</th>
            <th className="px-4 py-2 text-left">Fecha</th>
            <th className="px-4 py-2 text-left">Cliente</th>
            <th className="px-4 py-2 text-left">Total</th>
            <th className="px-4 py-2 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map(v => (
            <tr key={v.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2">{v.id}</td>
              <td className="px-4 py-2">{new Date(v.fecha).toLocaleString()}</td>
              <td className="px-4 py-2">{clientesMap[v.cliente_id] ?? `#${v.cliente_id}`}</td>
              <td className="px-4 py-2">${v.total.toFixed(2)}</td>
              <td className="px-4 py-2">
                <button
                  onClick={() => navigate(`/ventas/${v.id}`)}
                  className="text-[#5170FF] hover:underline"
                >Ver</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Paginación */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm">
          Página {page} de {totalPages} (Total {filtered.length})
        </span>
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
