// src/components/routers/devoluciones/NuevaDevolucion.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

export const NuevaDevolucion = () => {
  const { ventaId } = useParams();       // ahora uso ventaId
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [ventasList, setVentasList]       = useState([]);
  const [detallesVenta, setDetallesVenta] = useState([]);
  const [cantidades, setCantidades]       = useState({});
  const [error, setError]                 = useState(null);

  // 1) Si no hay ventaId en la URL, cargo la lista de VENTAS (no devoluciones)
  useEffect(() => {
    if (ventaId) return;
    fetch(`${API_URL}/ventas`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Error cargando ventas');
        return res.json();
      })
      .then(setVentasList)
      .catch(err => setError(err.message));
  }, [ventaId, token]);

  // 2) Si hay ventaId, cargo los detalles de esa VENTA
  useEffect(() => {
    if (!ventaId) return;
    fetch(`${API_URL}/detalle_ventas/venta/${ventaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Error cargando ítems de la venta');
        return res.json();
      })
      .then(data => {
        setDetallesVenta(data);
        // inicializar cantidades de devolución en 0
        const init = {};
        data.forEach(d => { init[d.producto_id] = 0; });
        setCantidades(init);
      })
      .catch(err => setError(err.message));
  }, [ventaId, token]);

  // Al hacer click en una venta, navego a /devoluciones/nueva/:ventaId
  const handleSelectVenta = id => {
    navigate(`/devoluciones/nueva/${id}`);
  };

  // Control de inputs
  const handleChange = (productoId, value) => {
    const max = detallesVenta.find(d => d.producto_id === productoId)?.cantidad || 0;
    const qty = Math.min(Math.max(0, Number(value)), max);
    setCantidades(prev => ({ ...prev, [productoId]: qty }));
  };

  // Envío al backend
  const handleSubmit = async e => {
    e.preventDefault();
    const items = Object.entries(cantidades)
      .filter(([_, qty]) => qty > 0)
      .map(([producto_id, cantidad]) => ({
        producto_id: Number(producto_id),
        cantidad
      }));

    if (items.length === 0) {
      return setError('Debes devolver al menos una unidad');
    }

    try {
      const res = await fetch(`${API_URL}/devoluciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ venta_id: Number(ventaId), items })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Error al crear la devolución');
      }
      const nuevaDev = await res.json();
      // redirijo a ver esa devolución:
      navigate(`/devoluciones/ver/${nuevaDev.id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  // --- RENDER ---

  if (error) {
    return <p className="p-6 text-red-600">{error}</p>;
  }

  //  A) Sin ventaId: muestro la lista de VENTAS
  if (!ventaId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-extrabold text-[#5170FF] mb-4">
          Selecciona la Venta para Devolver
        </h1>
        <table className="min-w-full bg-white rounded-lg shadow">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Fecha</th>
              <th className="px-4 py-2 text-left">Total</th>
              <th className="px-4 py-2 text-left">Acción</th>
            </tr>
          </thead>
          <tbody>
            {ventasList.map(v => (
              <tr key={v.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{v.id}</td>
                <td className="px-4 py-2">{new Date(v.fecha).toLocaleString()}</td>
                <td className="px-4 py-2">${v.total.toFixed(2)}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleSelectVenta(v.id)}
                    className="text-[#5170FF] hover:underline"
                  >
                    Devolver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  //  B) Con ventaId: muestro el formulario
  if (!detallesVenta.length) {
    return <p className="p-6">Cargando ítems de la venta…</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-extrabold text-[#5170FF] mb-4">
        Devolución de la Venta #{ventaId}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {detallesVenta.map(d => (
          <div key={d.id} className="flex items-center space-x-4">
            <span className="flex-1">
              Producto #{d.producto_id} — Vendido: {d.cantidad}
            </span>
            <input
              type="number"
              min="0"
              max={d.cantidad}
              value={cantidades[d.producto_id]}
              onChange={e => handleChange(d.producto_id, e.target.value)}
              className="w-20 p-1 border rounded text-center"
            />
          </div>
        ))}

        <button
          type="submit"
          className="px-4 py-2 bg-[#5170FF] text-white rounded hover:bg-opacity-90 transition"
        >
          Confirmar Devolución
        </button>
      </form>
    </div>
  );
};
