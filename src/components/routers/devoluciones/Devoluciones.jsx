// src/components/routers/devoluciones/Devoluciones.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

export const Devoluciones = () => {
  const [devoluciones, setDevoluciones] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch(`${API_URL}/devoluciones`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Error cargando devoluciones');
        return res.json();
      })
      .then(setDevoluciones)
      .catch(console.error);
  }, [token]);

  return (
    <div className="p-6 overflow-x-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl text-lexend-extrabold text-[#5170FF]">Devoluciones</h1>
        <button
          onClick={() => navigate('/devoluciones/nueva')}
          className="px-4 py-2 bg-[#5170FF] text-white rounded hover:bg-opacity-90 transition"
        >
          Nueva Devolución
        </button>
      </div>

      <table className="min-w-full bg-white rounded-lg shadow">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="px-4 py-2 text-lexend-medium text-left">ID</th>
            <th className="px-4 py-2 text-lexend-medium text-left">Venta</th>
            <th className="px-4 py-2 text-lexend-medium text-left">Fecha</th>
            <th className="px-4 py-2 text-lexend-medium text-left">Items</th>
            <th className="px-4 py-2 text-lexend-medium text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {devoluciones.map(d => (
            <tr key={d.id} className="border-b last:border-b-0 hover:bg-gray-50">
              <td className="px-4 py-2">{d.id}</td>
              <td className="px-4 py-2">{d.venta_id}</td>
              <td className="px-4 py-2">{new Date(d.fecha).toLocaleString()}</td>
              <td className="px-4 py-2">{d.detalles.length}</td>
              <td className="px-4 py-2">
                <button
                  onClick={() => navigate(`/devoluciones/${d.id}`)}
                  className="text-[#5170FF] hover:underline text-lexend-medium"
                >
                  Ver
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
