// src/components/routers/devoluciones/DevolucionItem.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const API_URL = import.meta.env.VITE_API_URL;

export const DevolucionItem = () => {
  const { id } = useParams();  // ID de la devolución
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [devolucion, setDevolucion] = useState(null);
  const [productosMap, setProductosMap] = useState({});

  // 1) Cargar devolución
  useEffect(() => {
    fetch(`${API_URL}/devoluciones/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Error cargando la devolución');
        return res.json();
      })
      .then(data => setDevolucion(data))
      .catch(console.error);
  }, [id, token]);

  // 2) Cargar nombres de productos
  useEffect(() => {
    if (!devolucion) return;
    devolucion.detalles.forEach(det => {
      if (!productosMap[det.producto_id]) {
        fetch(`${API_URL}/productos/${det.producto_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(p => {
            setProductosMap(prev => ({ ...prev, [det.producto_id]: p.nombre }));
          })
          .catch(console.error);
      }
    });
  }, [devolucion, productosMap, token]);

  if (!devolucion) {
    return <p className="p-6">Cargando devolución…</p>;
  }

  const totalDevuelto = devolucion.detalles
    .reduce((sum, det) => sum + det.subtotal, 0)
    .toFixed(2);

  return (
    <div className="p-6 relative">
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-300 text-[#5170FF] border-2 border-[#5170FF] rounded hover:bg-[#5170FF] hover:text-white transition text-lexend-medium"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Volver
        </button>
      </div>

      <h2 className="text-2xl font-extrabold text-[#5170FF] mb-2">Devolución #{devolucion.id}</h2>
      <p className="mb-4">
        <span className="font-medium">Venta relacionada:</span> {devolucion.venta_id}
      </p>
      <p className="mb-6">
        <span className="font-medium">Fecha:</span>{' '}
        {new Date(devolucion.fecha).toLocaleString()}
      </p>

      <h3 className="text-xl font-extrabold text-[#5170FF] mb-2">Detalles devueltos</h3>
      <table className="min-w-full bg-white rounded-lg shadow mb-4">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="px-4 py-2 text-left">Producto</th>
            <th className="px-4 py-2 text-center">Cant.</th>
            <th className="px-4 py-2 text-right">Precio Unit.</th>
            <th className="px-4 py-2 text-center">Desc. %</th>
            <th className="px-4 py-2 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {devolucion.detalles.map(det => (
            <tr key={det.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2">
                {productosMap[det.producto_id] ?? `#${det.producto_id}`}
              </td>
              <td className="px-4 py-2 text-center">{det.cantidad}</td>
              <td className="px-4 py-2 text-right">${det.precio_unitario.toFixed(2)}</td>
              <td className="px-4 py-2 text-center">{det.descuento_individual}%</td>
              <td className="px-4 py-2 text-right">${det.subtotal.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-right font-bold text-lg">
        Total Devuelto: ${totalDevuelto}
      </div>
    </div>
  );
};
