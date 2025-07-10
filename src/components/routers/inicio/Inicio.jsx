// src/components/Inicio.jsx

import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCashRegister, faDollarSign, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const API_URL = import.meta.env.VITE_API_URL;

export const Inicio = () => {
  const [ventasHoy, setVentasHoy] = useState([]);
  const [productosData, setProductosData] = useState([]);
  const [devolHoy, setDevolHoy] = useState([]);
  const [totalDevoluciones, setTotalDevoluciones] = useState(0);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1) Traer ventas, productos y devoluciones
        const [ventasRes, productosRes, devolRes] = await Promise.all([
          fetch(`${API_URL}/ventas`,     { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/productos`,  { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/devoluciones`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (!ventasRes.ok || !productosRes.ok || !devolRes.ok) {
          throw new Error('Error cargando datos');
        }
        const ventasData     = await ventasRes.json();
        const productosList  = await productosRes.json();
        const devolData      = await devolRes.json();

        // 2) Filtrar los de hoy
        const hoyStr = new Date().toDateString();
        const ventasHoyList = ventasData.filter(v => 
          new Date(v.fecha).toDateString() === hoyStr
        );
        const devolHoyList = devolData.filter(d => 
          new Date(d.fecha).toDateString() === hoyStr
        );

        setVentasHoy(ventasHoyList);
        setProductosData(productosList);
        setDevolHoy(devolHoyList);

        // 3) Calcular total de devoluciones usando precio de venta + descuento
        const saleDetailsArrays = await Promise.all(
          devolHoyList.map(d =>
            fetch(`${API_URL}/detalle_ventas/venta/${d.venta_id}`, {
              headers: { Authorization: `Bearer ${token}` }
            }).then(res => res.json())
          )
        );

        let sumaDevoluciones = 0;
        devolHoyList.forEach((d, idx) => {
          // encontrar la venta asociada para obtener su descuento
          const venta = ventasData.find(v => v.id === d.venta_id);
          const factorDesc = 1 - ((venta?.descuento ?? 0) / 100);

          const detallesVenta = saleDetailsArrays[idx];
          // para cada item devuelto, usar precio_unitario de la venta y aplicar descuento
          const importeDevo = d.detalles.reduce((subtotal, det) => {
            const svDet = detallesVenta.find(sd => sd.producto_id === det.producto_id);
            const precioUnit = svDet?.precio_unitario ?? 0;
            return subtotal + precioUnit * det.cantidad * factorDesc;
          }, 0);

          sumaDevoluciones += importeDevo;
        });

        setTotalDevoluciones(sumaDevoluciones);
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

  // 4) Calcular totales
  const totalVentas = ventasHoy.reduce((sum, v) => sum + (v.total ?? 0), 0);
  const netIngresos = totalVentas - totalDevoluciones;
  const productosBajos = productosData.filter(p => p.stock_actual <= 5);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-extrabold text-[#5170FF] mb-8">Panel de Control</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Ventas de hoy */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <FontAwesomeIcon icon={faCashRegister} className="text-4xl text-[#5170FF] mb-4" />
          <span className="text-xl text-gray-600">Ventas Hoy</span>
          <span className="text-2xl font-bold">{ventasHoy.length}</span>
        </div>

        {/* Ingresos netos (restando devoluciones) */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <FontAwesomeIcon icon={faDollarSign} className="text-4xl text-[#5170FF] mb-4" />
          <span className="text-xl text-gray-600">Ingresos Netos Hoy</span>
          <span className="text-2xl font-bold">${netIngresos.toFixed(2)}</span>
          {totalDevoluciones > 0 && (
            <span className="text-sm text-red-500 mt-1">
              (-${totalDevoluciones.toFixed(2)} en devoluciones)
            </span>
          )}
        </div>

        {/* Productos con stock bajo */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-4xl text-[#5170FF] mb-4" />
          <span className="text-xl text-gray-600">Productos Bajos</span>
          <span className="text-2xl font-bold">{productosBajos.length}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold text-[#5170FF] mb-4">Productos con stock bajo</h2>
        {productosBajos.length > 0 ? (
          <ul className="list-disc list-inside space-y-2">
            {productosBajos.map(p => (
              <li key={p.id}>
                {p.nombre} — {p.stock_actual} unidades
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No hay productos con stock bajo.</p>
        )}
      </div>
    </div>
  );
};
