import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

export const Productos = () => {
  const [productos, setProductos] = useState([]);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/productos`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setProductos)
      .catch(console.error);
  }, []);

  useEffect(() => {
    const ws = new WebSocket(`${API_URL.replace("http", "ws")}/ws/stock?token=${token}`);
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.event === "stock_update") {
        setProductos(prev =>
          prev.map(p => p.id === msg.producto_id ? { ...p, stock_actual: msg.new_stock } : p)
        );
      }
    };
    return () => ws.close();
  }, []);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-lexend-medium text-[#5170FF]">Productos</h2>
        <button
          onClick={() => navigate("/productos/nuevo")}
          className="flex items-center gap-2 bg-[#5170FF] text-white px-4 py-2 rounded-md hover:bg-[#3f5be0] transition text-lexend-medium"
        >
          <FontAwesomeIcon icon={faPlus} /> Agregar
        </button>
      </div>

      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
        {productos.map(p => (
          <div
            key={p.id}
            onClick={() => navigate(`/productos/${p.id}`)}
            className="cursor-pointer bg-white rounded-lg shadow p-3 w-full min-h-[240px] flex flex-col justify-between relative border border-gray-200 hover:shadow-md transition"
          >
            <img
              src={p.image_url ? `${API_URL}${p.image_url}` : "https://via.placeholder.com/150x100?text=Sin+Imagen"}
              alt={p.nombre}
              className="w-full h-28 object-contain rounded bg-white mb-2"
            />
            <h3 className="text-sm text-lexend-medium text-[#5170FF]">{p.nombre}</h3>
            <p className="text-xs text-gray-600">Código: {p.codigo}</p>
            <p className="text-xs text-gray-600">Stock: {p.stock_actual}</p>
            <p className="text-xs text-gray-600 mb-1">
              Precio: ${p.precio_unitario ? p.precio_unitario.toFixed(2) : "0.00"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

