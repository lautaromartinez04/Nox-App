import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPrint, faArrowLeft } from '@fortawesome/free-solid-svg-icons'

export const ReporteImprimible = () => {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { stats, fromDate, toDate } = state || {}

  // Si no vienen stats, volvemos a Reportes
  useEffect(() => {
    if (!stats) navigate('/reportes')
  }, [stats, navigate])

  if (!stats) return null

  return (
    <>
      {/* Reset márgenes de página y body en impresión */}
      <style media="print">{`
        @page {
          margin:0 1.5cm 0 0;      /* margen igual alrededor */
        }
        body {
          margin: 0;
        }
      `}</style>
      <div
        className={`
          p-6 font-sans relative
          print:mx-auto
          print:px-0 print:py-0
          print:max-w-screen-md
        `}
      >
        {/* Botón Volver (oculto en impresión) */}
        <div className="absolute top-4 right-4 z-10 print:hidden">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-300 text-[#5170FF] border-2 border-[#5170FF] rounded hover:bg-[#5170FF] hover:text-white transition text-lexend-medium"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Volver
          </button>
        </div>

        {/* Botón Imprimir (oculto en impresión) */}
        <button
          onClick={() => window.print()}
          className="print:hidden mb-4 px-4 py-2 bg-[#5170FF] text-white rounded hover:bg-[#3f5be0] transition text-lexend-medium flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPrint} /> Imprimir Reporte
        </button>

        {/* Contenido imprimible */}
        <div className="space-y-6 text-lexend-regular">
          {/* Encabezado */}
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-[#5170FF]">Reporte</h1>
            <p className="text-sm mt-1">
              Desde: <span className="font-medium">{fromDate}</span> —  
              Hasta: <span className="font-medium">{toDate}</span>
            </p>
            <hr className="my-4" />
          </div>

          {/* 1) Volumen */}
          <section>
            <h2 className="text-xl font-bold mb-2">Métricas de Volumen</h2>
            <ul className="list-disc list-inside">
              <li>Ventas: {stats.ventasCount} (${stats.totalVentas.toFixed(2)})</li>
              <li>Devoluciones: {stats.devolCount} (${stats.totalDevol.toFixed(2)})</li>
              <li>Gastos: {stats.gastosCount} (${stats.totalGastos.toFixed(2)})</li>
            </ul>
          </section>

          {/* 2) Financieras */}
          <section>
            <h2 className="text-xl font-bold mb-2">Métricas Financieras</h2>
            <ul className="list-disc list-inside">
              <li>Ingresos Netos: ${stats.netIngresos.toFixed(2)}</li>
              <li>Ganancia Exacta: ${stats.profit.toFixed(2)}</li>
            </ul>
          </section>

          {/* 3) Listados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section>
              <h2 className="text-xl font-bold mb-2">Top Productos Vendidos</h2>
              <ol className="list-decimal list-inside">
                {stats.topVendidos.map((p, i) => (
                  <li key={i}>{p.producto} — {p.cantidad} uds.</li>
                ))}
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-2">Productos de Baja Rotación</h2>
              <ol className="list-decimal list-inside">
                {stats.bajoRotacion.map((p, i) => (
                  <li key={i}>{p.producto} — {p.cantidad} uds.</li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}