import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCashRegister,
  faDollarSign,
  faChartLine,
  faMoneyBillWave,
  faFileInvoiceDollar,
  faExclamationTriangle,
  faPrint,
  faP,
} from '@fortawesome/free-solid-svg-icons';

const API_URL = import.meta.env.VITE_API_URL;

export const Inicio = () => {
  const [ventasHoy, setVentasHoy] = useState([]);
  const [productosData, setProductosData] = useState([]);
  const [devolHoy, setDevolHoy] = useState([]);
  const [gastosHoy, setGastosHoy] = useState([]);
  const [totalDevoluciones, setTotalDevoluciones] = useState(0);
  const [totalGastos, setTotalGastos] = useState(0);
  const [avgMargin, setAvgMargin] = useState(0);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ventasRes, productosRes, devolRes, gastosRes] = await Promise.all([
          fetch(`${API_URL}/ventas`,       { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/productos`,    { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/devoluciones`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/gastos`,       { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (!ventasRes.ok || !productosRes.ok || !devolRes.ok || !gastosRes.ok) {
          throw new Error('Error cargando datos');
        }

        const ventasData    = await ventasRes.json();
        const productosList = await productosRes.json();
        const devolData     = await devolRes.json();
        const gastosData    = await gastosRes.json();

        const hoyStr = new Date().toDateString();
        const ventasHoyList = ventasData.filter(v => new Date(v.fecha).toDateString() === hoyStr);
        const devolHoyList  = devolData.filter(d => new Date(d.fecha).toDateString() === hoyStr);
        const gastosHoyList = gastosData.filter(g => new Date(g.fecha).toDateString() === hoyStr);

        setVentasHoy(ventasHoyList);
        setProductosData(productosList);
        setDevolHoy(devolHoyList);
        setGastosHoy(gastosHoyList);

        // Calcular devoluciones
        const detallesPorVenta = await Promise.all(
          ventasHoyList.map(v =>
            fetch(`${API_URL}/detalle_ventas/venta/${v.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            }).then(res => res.json())
          )
        );
        const detallesMap = {};
        ventasHoyList.forEach((v, i) => { detallesMap[v.id] = detallesPorVenta[i]; });

        let sumaDevol = 0;
        devolHoyList.forEach(d => {
          const venta = ventasData.find(v => v.id === d.venta_id);
          const factorVenta = 1 - ((venta?.descuento || 0) / 100);
          d.detalles.forEach(det => {
            const orig = detallesMap[d.venta_id].find(sd => sd.producto_id === det.producto_id) || {};
            const factorInd = 1 - ((orig.descuento_individual || 0) / 100);
            const precioUnit = orig.precio_unitario || 0;
            sumaDevol += precioUnit * det.cantidad * factorInd * factorVenta;
          });
        });
        setTotalDevoluciones(sumaDevol);

        const sumaGastos = gastosHoyList.reduce((sum, g) => sum + (g.monto || 0), 0);
        setTotalGastos(sumaGastos);

        const allDetalles = detallesPorVenta.flat();
        if (allDetalles.length > 0) {
          const sumaMargenes = allDetalles.reduce((sum, sd) => {
            const prod = productosList.find(p => p.id === sd.producto_id) || {};
            return sum + (prod.margen || 0);
          }, 0);
          setAvgMargin(sumaMargenes / allDetalles.length);
        } else {
          setAvgMargin(0);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_URL, token]);

  if (loading) {
    return <p className="p-6">Cargando dashboard...</p>;
  }

  const totalVentas = ventasHoy.reduce((sum, v) => sum + (v.total || 0), 0);
  const netIngresos = totalVentas - totalDevoluciones - totalGastos;
  const estProfit   = netIngresos * (avgMargin / 100);

  // Filtrar productos con stock bajo según stock_actual <= stock_bajo
  const lowStockProducts = productosData.filter(p => {
    const stockActual = Number(p.stock_actual ?? 0);
    const umbral       = Number(p.stock_bajo  ?? 0);
    return stockActual <= umbral;
  });

  const handlePrintLowStock = () => {
    const lowStockItems = lowStockProducts.map(p =>
      `<li><strong>${p.nombre}</strong>: ${p.descripcion || p.descripcion_corta || ''} — ${Number(p.stock_actual)} uds.</li>`
    ).join('');
    const printWin = window.open('', '', 'width=600,height=600');
    printWin.document.write(`
      <html>
        <head>
          <title>Productos con Stock Bajo</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { font-size: 1.5rem; margin-bottom: 1rem; }
            ul { list-style: none; padding: 0; }
            li { margin: 6px 0; font-size: 0.95rem; }
          </style>
        </head>
        <body>
          <h1>Productos con Stock Bajo</h1>
          <ul>${lowStockItems}</ul>
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    printWin.print();
    printWin.close();
  };

  return (
    <div className="p-6 w-full">
      <h1 className="text-3xl font-extrabold text-[#5170FF] mb-8">Panel de Control</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-10">
        <div className="card">
          <FontAwesomeIcon icon={faCashRegister} className="icon" />
          <span className="label">Ventas Hoy</span>
          <span className="value">{ventasHoy.length}</span>
        </div>
        <div className="card">
          <FontAwesomeIcon icon={faDollarSign} className="icon" />
          <span className="label">Ingresos Netos</span>
          <span className="value">${netIngresos.toFixed(2)}</span>
          {(totalDevoluciones > 0 || totalGastos > 0) && (
            <span className="subvalue">(-${totalDevoluciones.toFixed(2)} devoluciones, -${totalGastos.toFixed(2)} gastos)</span>
          )}
        </div>
        <div className="card">
          <FontAwesomeIcon icon={faFileInvoiceDollar} className="icon" />
          <span className="label">Gastos Hoy</span>
          <span className="value">${totalGastos.toFixed(2)}</span>
        </div>
        <div className="card">
          <FontAwesomeIcon icon={faChartLine} className="icon" />
          <span className="label">Margen Promedio %</span>
          <span className="value">{avgMargin.toFixed(2)}</span>
        </div>
        <div className="card">
          <FontAwesomeIcon icon={faMoneyBillWave} className="icon" />
          <span className="label">Ganancia Estimada</span>
          <span className="value">${estProfit.toFixed(2)}</span>
        </div>
      </div>

      <div id="low-stock-section" className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-[#5170FF]">Stock Bajo</h2>
          <button
            onClick={handlePrintLowStock}
            className="flex items-center px-4 py-2 bg-[#5170FF] text-white rounded hover:bg-opacity-90 transition"
          >
            <FontAwesomeIcon icon={faPrint} className="mr-2" />Imprimir
          </button>
        </div>
        <ul className="divide-y divide-gray-200">
          {lowStockProducts.length > 0 ? (
            lowStockProducts.map(p => (
              <li key={p.id} className="py-2 flex justify-between">
                <span>{p.nombre}</span>
                <span className="font-semibold">{Number(p.stock_actual)} uds.</span>
              </li>
            ))
          ) : (
            <li className="py-2 text-gray-600">No hay productos con stock bajo</li>
          )}
        </ul>
      </div>
    </div>
  );
};