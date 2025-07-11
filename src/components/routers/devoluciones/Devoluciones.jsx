// src/components/routers/devoluciones/Devoluciones.jsx

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'

const API_URL = import.meta.env.VITE_API_URL

export const Devoluciones = () => {
  const [devoluciones, setDevoluciones] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  // Fetch devoluciones
  const fetchDevoluciones = () => {
    fetch(`${API_URL}/devoluciones`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject('Error cargando devoluciones'))
      .then(setDevoluciones)
      .catch(console.error)
  }
  useEffect(fetchDevoluciones, [token])

  // Compute details for each devolución
  const withDetails = devoluciones.map(d => {
    const unidades = d.detalles.reduce((sum, det) => sum + det.cantidad, 0)
    const totalDevuelto = d.detalles.reduce((sum, det) => sum + det.subtotal, 0)
    return { ...d, unidades, totalDevuelto }
  })

  // Filters
  const filtered = withDetails.filter(d => {
    const term = searchTerm.toLowerCase()
    const matchSearch =
      d.id.toString().includes(term) ||
      d.venta_id.toString().includes(term)
    let inRange = true
    const fecha = new Date(d.fecha)
    if (dateFrom) inRange = inRange && fecha >= new Date(dateFrom)
    if (dateTo)   inRange = inRange && fecha <= new Date(dateTo)
    return matchSearch && inRange
  })

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize) || 1
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="p-6 overflow-x-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-extrabold text-[#5170FF]">Devoluciones</h1>
        <button
          onClick={() => navigate('/devoluciones/nueva')}
          className="flex items-center gap-2 px-4 py-2 bg-[#5170FF] text-white rounded hover:bg-opacity-90 transition text-lexend-medium"
        >
          <FontAwesomeIcon icon={faPlus} />
          Nueva Devolución
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm">Buscar ID/Venta:</label>
          <input
            type="text"
            placeholder="ID de la devolución o ID de la venta"
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

      {/* Tabla de devoluciones */}
      <table className="min-w-full bg-white rounded-lg shadow">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="px-4 py-2 text-left text-lexend-medium">ID</th>
            <th className="px-4 py-2 text-left text-lexend-medium">Venta</th>
            <th className="px-4 py-2 text-left text-lexend-medium">Fecha</th>
            <th className="px-4 py-2 text-left text-lexend-medium">Unidades</th>
            <th className="px-4 py-2 text-left text-lexend-medium">Total Devuelto</th>
            <th className="px-4 py-2 text-left text-lexend-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map(d => (
            <tr key={d.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2">{d.id}</td>
              <td className="px-4 py-2">{d.venta_id}</td>
              <td className="px-4 py-2">{new Date(d.fecha).toLocaleString()}</td>
              <td className="px-4 py-2">{d.unidades}</td>
              <td className="px-4 py-2">${d.totalDevuelto.toFixed(2)}</td>
              <td className="px-4 py-2">
                <button
                  onClick={() => navigate(`/devoluciones/${d.id}`)}
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
