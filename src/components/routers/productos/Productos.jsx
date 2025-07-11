// src/components/routers/productos/Productos.jsx

import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import Select from "react-select";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

export const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortOption, setSortOption] = useState("name_asc");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Carga inicial de productos
  useEffect(() => {
    fetch(`${API_URL}/productos`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setProductos)
      .catch(console.error);
  }, [token]);

  // Carga de categorías
  useEffect(() => {
    fetch(`${API_URL}/categorias`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setCategorias(data.map(c => ({ value: c.id, label: c.nombre }))))
      .catch(console.error);
  }, [token]);

  // WebSocket para stock en tiempo real
  useEffect(() => {
    const ws = new WebSocket(
      `${API_URL.replace("http", "ws")}/ws/stock?token=${token}`
    );
    ws.onmessage = e => {
      const msg = JSON.parse(e.data);
      if (msg.event === "stock_update") {
        setProductos(prev =>
          prev.map(p =>
            p.id === msg.producto_id
              ? { ...p, stock_actual: msg.new_stock }
              : p
          )
        );
      }
    };
    return () => ws.close();
  }, [token]);

  // Filtrar por nombre, código y categoría
  const filtrados = productos
    .filter(p =>
      (p.nombre ?? "").toLowerCase().includes(searchName.toLowerCase())
    )
    .filter(p =>
      (p.codigo_barras ?? "").toLowerCase().includes(searchCode.toLowerCase())
    )
    .filter(p => {
      if (!selectedCategory) return true;
      return p.categoria_id === selectedCategory.value;
    });

  // Ordenar
  const ordenados = [...filtrados].sort((a, b) => {
    switch (sortOption) {
      case "name_asc":
        return a.nombre.localeCompare(b.nombre);
      case "name_desc":
        return b.nombre.localeCompare(a.nombre);
      case "stock_asc":
        return a.stock_actual - b.stock_actual;
      case "stock_desc":
        return b.stock_actual - a.stock_actual;
      default:
        return 0;
    }
  });

  return (
    <div className="p-4 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-xl font-bold text-[#5170FF]">Productos</h2>
        <button
          onClick={() => navigate("/productos/nuevo")}
          className="flex items-center gap-2 bg-[#5170FF] text-white px-4 py-2 rounded-md hover:bg-[#3f5be0] transition"
        >
          <FontAwesomeIcon icon={faPlus} /> Agregar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={searchName}
          onChange={e => setSearchName(e.target.value)}
          className="p-2 border rounded w-full"
        />
        <input
          type="text"
          placeholder="Buscar por código..."
          value={searchCode}
          onChange={e => setSearchCode(e.target.value)}
          className="p-2 border rounded w-full"
        />
        <Select
          options={categorias}
          value={selectedCategory}
          onChange={setSelectedCategory}
          isClearable
          placeholder="Filtrar por categoría..."
          className="w-full"
        />
        <select
          value={sortOption}
          onChange={e => setSortOption(e.target.value)}
          className="p-2 border rounded w-full"
        >
          <option value="name_asc">Nombre A-Z</option>
          <option value="name_desc">Nombre Z-A</option>
          <option value="stock_asc">Stock ascendente</option>
          <option value="stock_desc">Stock descendente</option>
        </select>
      </div>

      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
        {ordenados.map(p => {
          const low = p.stock_actual <= p.stock_bajo;
          return (
            <div
              key={p.id}
              onClick={() => navigate(`/productos/${p.id}`)}
              className={
                `cursor-pointer bg-white rounded-lg shadow p-4 flex flex-col justify-between border transition hover:shadow-md ` +
                (low ? "border-red-400" : "border-gray-200")
              }
            >
              <img
                src={
                  p.image_url
                    ? `${API_URL}${p.image_url}`
                    : "https://via.placeholder.com/150x100?text=Sin+Imagen"
                }
                alt={p.nombre}
                className="w-full h-28 object-contain rounded bg-white mb-3"
              />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[#5170FF] mb-1">
                  {p.nombre}
                </h3>
                <p className="text-xs text-gray-600 mb-0.5">Código: {p.codigo}</p>
                <p className={`text-xs text-gray-600 mb-0.5`}>
                  Precio: ${p.precio_unitario.toFixed(2)}
                </p>
                <p className="text-xs text-gray-600 mb-0.5">
                  {p.descripcion}
                </p>
                <p className={
                    `text-xs mb-0.5 ` + (low ? "text-red-600" : "text-gray-600")
                  }
                >
                  Stock: {p.stock_actual}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};