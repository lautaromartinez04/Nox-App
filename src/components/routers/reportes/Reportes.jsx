// src/components/routers/reportes/Reportes.jsx

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCalendarAlt,
  faPrint,
  faShoppingCart,
  faUndo,
  faReceipt,
  faDollarSign,
  faMoneyBillWave,
  faChartLine
} from '@fortawesome/free-solid-svg-icons'

export const Reportes = () => {
  const API_URL = import.meta.env.VITE_API_URL
  const token = localStorage.getItem('token')
  const navigate = useNavigate()

  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState(null)

  const handleGenerate = async () => {
    if (!fromDate || !toDate) {
      setError('Seleccione ambas fechas')
      return
    }
    setError('')
    setLoading(true)
    try {
      // 1) Traer datos
      const [ventasRes, productosRes, devolRes, gastosRes] = await Promise.all([
        fetch(`${API_URL}/ventas`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/productos`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/devoluciones`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/gastos`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (!ventasRes.ok || !productosRes.ok || !devolRes.ok || !gastosRes.ok) {
        throw new Error('Error al cargar datos de reporte')
      }

      const [ventasAll, productos, devolAll, gastosAll] = await Promise.all([
        ventasRes.json(),
        productosRes.json(),
        devolRes.json(),
        gastosRes.json()
      ])

      // 2) Filtrar por rango
      const start = new Date(fromDate)
      const end = new Date(toDate); end.setHours(23, 59, 59)

      const ventas = ventasAll.filter(v => {
        const d = new Date(v.fecha)
        return d >= start && d <= end
      })
      const devol = devolAll.filter(d => {
        const d0 = new Date(d.fecha)
        return d0 >= start && d0 <= end
      })
      const gastos = gastosAll.filter(g => {
        const d1 = new Date(g.fecha)
        return d1 >= start && d1 <= end
      })

      // 3) Totales y conteos
      const ventasCount = ventas.length
      const totalVentas = ventas.reduce((s, v) => s + (v.total || 0), 0)

      const gastosCount = gastos.length
      const totalGastos = gastos.reduce((s, g) => s + (g.monto || 0), 0)

      // 4) Detalles de ventas
      const detallesPorVenta = await Promise.all(
        ventas.map(v =>
          fetch(`${API_URL}/detalle_ventas/venta/${v.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(res => res.json())
        )
      )
      const detallesMap = {}
      ventas.forEach((v, i) => { detallesMap[v.id] = detallesPorVenta[i] })

      // 5) Cálculo de devoluciones
      const devolCount = devol.length
      let totalDevol = 0
      devol.forEach(d => {
        const venta = ventas.find(v => v.id === d.venta_id)
        const factorG = 1 - ((venta?.descuento || 0) / 100)
        d.detalles.forEach(dd => {
          const sd = detallesMap[d.venta_id].find(x => x.producto_id === dd.producto_id)
          if (!sd) return
          const unitNet = sd.precio_unitario * (1 - ((sd.descuento_individual || 0) / 100))
          totalDevol += unitNet * dd.cantidad * factorG
        })
      })

      // 6) Ingresos netos
      const netIngresos = totalVentas - totalDevol - totalGastos

      // 7) Profit ajustado
      const costoMap = Object.fromEntries(productos.map(p => [p.id, p.precio_costo || 0]))

      const salesProfit = detallesPorVenta.flat().reduce((sum, det) => {
        const revLine = det.precio_unitario * det.cantidad * (1 - ((det.descuento_individual || 0) / 100))
        const venta = ventas.find(v => v.id === det.venta_id)
        const revNet = revLine * (1 - ((venta?.descuento || 0) / 100))
        const costLine = (costoMap[det.producto_id] || 0) * det.cantidad
        return sum + (revNet - costLine)
      }, 0)

      let returnsLoss = 0
      devol.forEach(d => {
        const venta = ventas.find(v => v.id === d.venta_id)
        const factorG = 1 - ((venta?.descuento || 0) / 100)
        d.detalles.forEach(dd => {
          const sd = detallesMap[d.venta_id].find(x => x.producto_id === dd.producto_id)
          if (!sd) return
          const unitNet = sd.precio_unitario * (1 - ((sd.descuento_individual || 0) / 100))
          const revReturn = unitNet * dd.cantidad * factorG
          const costReturn = (costoMap[dd.producto_id] || 0) * dd.cantidad
          returnsLoss += (revReturn - costReturn)
        })
      })

      const profit = salesProfit - returnsLoss

      // 8) Top y baja rotación
      const countMap = {}
      detallesPorVenta.flat().forEach(det => {
        countMap[det.producto_id] = (countMap[det.producto_id] || 0) + det.cantidad
      })
      devol.forEach(d => {
        d.detalles.forEach(dd => {
          countMap[dd.producto_id] = (countMap[dd.producto_id] || 0) - dd.cantidad
        })
      })
      const counts = Object.entries(countMap).map(([pid, qty]) => ({
        producto: productos.find(p => p.id === +pid)?.nombre || `#${pid}`,
        cantidad: Math.max(0, qty)
      }))
      const topVendidos = counts.sort((a, b) => b.cantidad - a.cantidad).slice(0, 5)
      const bajoRotacion = counts.sort((a, b) => a.cantidad - b.cantidad).slice(0, 5)

      setStats({
        ventasCount, totalVentas,
        devolCount, totalDevol,
        gastosCount, totalGastos,
        netIngresos, profit,
        topVendidos, bajoRotacion
      })
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-lexend-extrabold text-3xl text-[#5170FF] mb-4">
        Reportes
      </h1>

      {/* Filtros de fecha */}
      <div className="flex gap-4 mb-6">
        <div>
          <label className="text-lexend-medium text-sm block mb-1">
            Desde
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="border p-2 rounded text-lexend-regular"
          />
        </div>
        <div>
          <label className="text-lexend-medium text-sm block mb-1">
            Hasta
          </label>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="border p-2 rounded text-lexend-regular"
          />
        </div>
        <button
          onClick={handleGenerate}
          className="self-end bg-[#5170FF] text-white px-4 py-2 rounded hover:bg-[#3f5be0] transition text-lexend-medium"
        >
          <FontAwesomeIcon icon={faCalendarAlt} /> Generar
        </button>
      </div>

      {error && (
        <p className="text-red-500 mb-4 text-lexend-regular">{error}</p>
      )}
      {loading && (
        <p className="text-lexend-regular">Cargando...</p>
      )}

      {stats && !loading && (
        <>
          {/* Botón de impresión */}
          <button
            onClick={() => navigate('/reportesimprimible', { state: { stats, fromDate, toDate } })}
            className="mb-4 px-4 py-2 bg-[#5170FF] text-white rounded hover:bg-[#3f5be0] transition text-lexend-medium flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPrint} /> Imprimir Reporte
          </button>

          <div className="space-y-6">
            {/* 1) Volumen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-white p-4 rounded shadow">
                <h3 className="text-lexend-medium font-bold">
                  <FontAwesomeIcon icon={faShoppingCart} /> Ventas
                </h3>
                <p className="text-lexend-regular">
                  Cantidad: <span className="text-lexend-extrabold">{stats.ventasCount}</span>
                </p>
                <p className="text-lexend-regular">
                  Total: <span className="text-lexend-extrabold">${stats.totalVentas.toFixed(2)}</span>
                </p>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <h3 className="text-lexend-medium font-bold">
                  <FontAwesomeIcon icon={faUndo} /> Devoluciones
                </h3>
                <p className="text-lexend-regular">
                  Cantidad: <span className="text-lexend-extrabold">{stats.devolCount}</span>
                </p>
                <p className="text-lexend-regular">
                  Total: <span className="text-lexend-extrabold">${stats.totalDevol.toFixed(2)}</span>
                </p>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <h3 className="text-lexend-medium font-bold">
                  <FontAwesomeIcon icon={faReceipt} /> Gastos
                </h3>
                <p className="text-lexend-regular">
                  Cantidad: <span className="text-lexend-extrabold">{stats.gastosCount}</span>
                </p>
                <p className="text-lexend-regular">
                  Total: <span className="text-lexend-extrabold">${stats.totalGastos.toFixed(2)}</span>
                </p>
              </div>
            </div>
            {/* 2) Financieras */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-4 rounded shadow">
                <h3 className="text-lexend-medium font-bold">
                  <FontAwesomeIcon icon={faDollarSign} /> Ingresos Netos
                </h3>
                <p className="text-lexend-extrabold">${stats.netIngresos.toFixed(2)}</p>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <h3 className="text-lexend-medium font-bold">
                  <FontAwesomeIcon icon={faMoneyBillWave} /> Ganancia Exacta
                </h3>
                <p className="text-lexend-extrabold">${stats.profit.toFixed(2)}</p>
              </div>
            </div>
            {/* 3) Listados */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded shadow">
                <h3 className="text-lexend-medium font-bold mb-2">
                  <FontAwesomeIcon icon={faChartLine} /> Top Productos Vendidos
                </h3>
                <ol className="list-decimal list-inside text-lexend-regular">
                  {stats.topVendidos.map((p, i) => (
                    <li key={i}>
                      {p.producto} — {p.cantidad} uds.
                    </li>
                  ))}
                </ol>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <h3 className="text-lexend-medium font-bold mb-2">
                  <FontAwesomeIcon icon={faChartLine} /> Productos de Baja Rotación
                </h3>
                <ol className="list-decimal list-inside text-lexend-regular">
                  {stats.bajoRotacion.map((p, i) => (
                    <li key={i}>
                      {p.producto} — {p.cantidad} uds.
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
