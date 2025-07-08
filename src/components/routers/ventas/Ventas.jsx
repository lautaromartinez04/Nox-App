// src/components/routers/ventas/Ventas.jsx

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL

export const Ventas = () => {
  const [ventas, setVentas] = useState([])
  const [clientesMap, setClientesMap] = useState({})
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  // 1) Carga inicial de clientes (para mapear id → nombre)
  useEffect(() => {
    fetch(`${API_URL}/clientes`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Error cargando clientes')
        return res.json()
      })
      .then(data => {
        const map = {}
        data.forEach(c => {
          map[c.id] = c.nombre
        })
        setClientesMap(map)
      })
      .catch(console.error)
  }, [token])

  // 2) Función para recargar ventas
  const fetchVentas = () => {
    fetch(`${API_URL}/ventas`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Error cargando ventas')
        return res.json()
      })
      .then(setVentas)
      .catch(console.error)
  }

  // 3) Carga inicial de ventas
  useEffect(fetchVentas, [token])

  // 4) WebSocket para nuevas ventas: recarga la tabla automáticamente
  useEffect(() => {
    const ws = new WebSocket(
      `${API_URL.replace(/^http/, 'ws')}/ws/ventas?token=${encodeURIComponent(token)}`
    )

    ws.addEventListener('message', evt => {
      const msg = JSON.parse(evt.data)
      if (msg.event === 'new_sale') {
        fetchVentas()
      }
    })

    return () => ws.close()
  }, [token])

  return (
    <div className="p-6 overflow-x-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl text-lexend-extrabold text-[#5170FF]">Ventas</h1>
      </div>

      <table className="min-w-full bg-white rounded-lg shadow">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="px-4 py-2 text-lexend-medium text-left">ID</th>
            <th className="px-4 py-2 text-lexend-medium text-left">Fecha</th>
            <th className="px-4 py-2 text-lexend-medium text-left">Cliente</th>
            <th className="px-4 py-2 text-lexend-medium text-left">Total</th>
            <th className="px-4 py-2 text-lexend-medium text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {ventas.map(v => (
            <tr key={v.id} className="border-b last:border-b-0 hover:bg-gray-50">
              <td className="px-4 py-2">{v.id}</td>
              <td className="px-4 py-2">{new Date(v.fecha).toLocaleString()}</td>
              <td className="px-4 py-2">
                {clientesMap[v.cliente_id] ?? `#${v.cliente_id}`}
              </td>
              <td className="px-4 py-2">${v.total.toFixed(2)}</td>
              <td className="px-4 py-2">
                <button
                  onClick={() => navigate(`/ventas/${v.id}`)}
                  className="text-[#5170FF] hover:underline text-lexend-medium transition"
                >
                  Ver
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
