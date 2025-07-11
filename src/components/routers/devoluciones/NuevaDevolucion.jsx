// src/components/routers/devoluciones/NuevaDevolucion.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const API_URL = import.meta.env.VITE_API_URL;

export const NuevaDevolucion = () => {
  const { ventaId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [ventasList, setVentasList] = useState([]);
  const [detallesVenta, setDetallesVenta] = useState([]);
  const [productosMap, setProductosMap] = useState({});
  const [returnedMap, setReturnedMap] = useState({});
  const [cantidades, setCantidades] = useState({});
  const [error, setError] = useState(null);

  // Carga productos para mostrar nombre e imagen
  useEffect(() => {
    fetch(`${API_URL}/productos`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : Promise.reject('Error cargando productos'))
      .then(data => {
        const map = {};
        data.forEach(p => map[p.id] = p);
        setProductosMap(map);
      })
      .catch(console.error);
  }, [token]);

  // Carga ventas si no hay ventaId
  useEffect(() => {
    if (ventaId) return;
    fetch(`${API_URL}/ventas`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : Promise.reject('Error cargando ventas'))
      .then(setVentasList)
      .catch(err => setError(err));
  }, [ventaId, token]);

  // Carga detalles y devoluciones previas si hay ventaId
  useEffect(() => {
    if (!ventaId) return;

    // detalles de venta
    fetch(`${API_URL}/detalle_ventas/venta/${ventaId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : Promise.reject('Error cargando ítems'))
      .then(data => {
        setDetallesVenta(data);
        const init = {};
        data.forEach(d => init[d.producto_id] = 0);
        setCantidades(init);
      })
      .catch(err => setError(err));

    // devoluciones previas
    fetch(`${API_URL}/devoluciones/venta/${ventaId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : Promise.reject('Error cargando devoluciones'))
      .then(devs => {
        const map = {};
        devs.forEach(dev => dev.items.forEach(item => {
          map[item.producto_id] = (map[item.producto_id] || 0) + item.cantidad;
        }));
        setReturnedMap(map);
      })
      .catch(console.error);
  }, [ventaId, token]);

  const handleSelectVenta = id => navigate(`/devoluciones/nueva/${id}`);

  const handleChange = (productoId, value) => {
    const vendido = detallesVenta.find(d => d.producto_id === productoId)?.cantidad || 0;
    const yaDevuelto = returnedMap[productoId] || 0;
    const restante = vendido - yaDevuelto;
    const qty = Math.min(Math.max(0, Number(value)), restante);
    setCantidades(prev => ({ ...prev, [productoId]: qty }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const items = Object.entries(cantidades)
      .filter(([, qty]) => qty > 0)
      .map(([producto_id, cantidad]) => ({ producto_id: Number(producto_id), cantidad }));

    if (!items.length) return setError('Debes seleccionar al menos una devolución');

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
        throw new Error(err.detail || 'Error creando devolución');
      }
      const nuevaDev = await res.json();
      navigate(`/devoluciones/${nuevaDev.id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  // RENDER
  return (
    <div className=" mx-auto p-6">
      {ventaId && (
        <></>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {!ventaId ? (
        <>
          <div className="relative">
            <div className="absolute right-4 z-100">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 bg-gray-300 text-[#5170FF] border-2 border-[#5170FF] rounded hover:bg-[#5170FF] hover:text-white transition text-lexend-medium"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                Volver
              </button>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-[#5170FF] mb-6">
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
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-[#5170FF] mb-6">
            Devolución Venta #{ventaId}
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            {detallesVenta.map(d => {
              const prod = productosMap[d.producto_id] || {};
              const nombre = prod.nombre || `#${d.producto_id}`;
              const vendido = d.cantidad;
              const yaDevuelto = returnedMap[d.producto_id] || 0;
              const restante = vendido - yaDevuelto;

              return (
                <div
                  key={d.id}
                  className="p-4 border rounded-lg shadow-sm flex items-center justify-between hover:shadow-md transition"
                >
                  <div className="flex-1">
                    <h2 className="font-semibold text-lg">{nombre}</h2>
                    <div className="flex space-x-2 mt-1 text-gray-600 text-sm">
                      <span>Vendido: <strong>{vendido}</strong></span>
                      <span>Devuelto: <strong>{yaDevuelto}</strong></span>
                      <span>Restan: <strong>{restante}</strong></span>
                    </div>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={restante}
                    value={cantidades[d.producto_id]}
                    onChange={e => handleChange(d.producto_id, e.target.value)}
                    disabled={restante === 0}
                    className="w-20 p-2 border rounded text-center focus:outline-none focus:ring-2 focus:ring-[#5170FF] disabled:opacity-50"
                  />
                </div>
              );
            })}
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => navigate(-2)}
                className="px-4 py-2 bg-gray-300 text-[#5170FF] border-2 border-[#5170FF] rounded hover:bg-[#5170FF] hover:text-white transition text-lexend-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#5170FF] text-white rounded hover:bg-[#3f5be0] transition text-lexend-medium"
              >
                Confirmar
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};
