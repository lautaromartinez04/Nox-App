// src/components/routers/ventas/VentaItem.jsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const API_URL = import.meta.env.VITE_API_URL;

export const VentasItem = () => {
  const { id } = useParams();           // "1", "2", etc.
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [venta, setVenta] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [cliente, setCliente] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [productosMap, setProductosMap] = useState({});
  const [devoluciones, setDevoluciones] = useState([]);

  // 1) Cargar la venta y sus detalles
  useEffect(() => {
    fetch(`${API_URL}/ventas/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error("Error al cargar la venta");
        return res.json();
      })
      .then(data => {
        setVenta(data);
        return fetch(`${API_URL}/detalle_ventas/venta/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
      .then(res => res.json())
      .then(setDetalles)
      .catch(console.error);
  }, [id, token]);

  // 2) Cargar cliente y usuario cuando tengamos la venta
  useEffect(() => {
    if (!venta) return;
    fetch(`${API_URL}/clientes/${venta.cliente_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setCliente)
      .catch(console.error);

    fetch(`${API_URL}/usuarios/${venta.usuario_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setUsuario)
      .catch(console.error);
  }, [venta, token]);

  // 3) Cargar el nombre de cada producto de la venta
  useEffect(() => {
    detalles.forEach(({ producto_id }) => {
      if (!productosMap[producto_id]) {
        fetch(`${API_URL}/productos/${producto_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(res => res.json())
          .then(p => {
            setProductosMap(prev => ({ ...prev, [producto_id]: p.nombre }));
          })
          .catch(console.error);
      }
    });
  }, [detalles, productosMap, token]);

  // 4) Cargar devoluciones relacionadas con esta venta
  useEffect(() => {
    fetch(`${API_URL}/devoluciones`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error("Error cargando devoluciones");
        return res.json();
      })
      .then(data => {
        const relacionadas = data.filter(d => d.venta_id === Number(id));
        setDevoluciones(relacionadas);
      })
      .catch(console.error);
  }, [id, token]);

  if (!venta) {
    return <p className="p-6">Cargando...</p>;
  }

  return (
    <div className="p-6 relative">
      {/* Botón Volver */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-300 text-[#5170FF] border-2 border-[#5170FF] rounded hover:bg-[#5170FF] hover:text-white transition"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Volver
        </button>
      </div>

      <h2 className="text-2xl font-extrabold mb-4 text-[#5170FF]">
        Venta #{venta.id}
      </h2>

      <div className="space-y-1 mb-6 text-gray-700">
        <p><strong>Fecha:</strong> {new Date(venta.fecha).toLocaleString()}</p>
        <p><strong>Cliente:</strong> {cliente ? cliente.nombre : venta.cliente_id}</p>
        <p><strong>Usuario:</strong> {usuario ? usuario.username : venta.usuario_id}</p>
        <p><strong>Total sin descuento:</strong> ${venta.total_sin_descuento}</p>
        <p><strong>Descuento global:</strong> %{venta.descuento}</p>
      </div>

      {/* Sección Devoluciones */}
      <div className="mb-6">
        <h3 className="text-xl font-extrabold text-[#5170FF] mb-2">Devoluciones</h3>
        {devoluciones.length > 0 ? (
          <ul className="list-disc list-inside">
            {devoluciones.map(d => {
              // Construir texto de ítems devueltos
              const itemsText = d.detalles
                .map(det => {
                  const nombre = productosMap[det.producto_id] || `#${det.producto_id}`;
                  return `${det.cantidad}× ${nombre}`;
                })
                .join(", ");
              return (
                <ul key={d.id}>
                  <button
                    onClick={() => navigate(`/devoluciones/ver/${d.id}`)}
                    className="text-[#5170FF] hover:underline text-lexend-light"
                  >
                    {itemsText} — {new Date(d.fecha).toLocaleDateString()}
                  </button>
                </ul>
              );
            })}
          </ul>
        ) : (
          <p className="text-gray-600">No hay devoluciones para esta venta.</p>
        )}
      </div>

      <h3 className="text-xl font-extrabold mb-2 text-[#5170FF]">Detalles de la Venta</h3>
      <table className="min-w-full bg-white rounded-lg shadow mb-6">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="px-4 py-2 text-left">Producto</th>
            <th className="px-4 py-2 text-left">Cantidad</th>
            <th className="px-4 py-2 text-left">Precio Unit.</th>
            <th className="px-4 py-2 text-left">Descuento</th>
            <th className="px-4 py-2 text-left">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {detalles.map(d => (
            <tr key={d.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2">{productosMap[d.producto_id] ?? `#${d.producto_id}`}</td>
              <td className="px-4 py-2">{d.cantidad}</td>
              <td className="px-4 py-2">${d.precio_unitario.toFixed(2)}</td>
              <td className="px-4 py-2">{d.descuento_individual}%</td>
              <td className="px-4 py-2">${d.subtotal.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-xl font-extrabold text-[#5170FF]">
        Total: ${venta.total.toFixed(2)}
      </p>
    </div>
  );
};
