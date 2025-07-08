import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisV, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);
const API_URL = import.meta.env.VITE_API_URL;

export const Productos = () => {
  const [productos, setProductos] = useState([]);
  const token = localStorage.getItem("token");

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

  const editarCampo = (producto, campo) => {
    MySwal.fire({
      title: `Editar ${campo === "stock_actual" ? "Stock" : "Precio"}`,
      input: "number",
      inputValue: producto[campo],
      confirmButtonText: "Guardar",
      showCancelButton: true,
    }).then(result => {
      if (!result.isConfirmed) return;
      const valor = parseFloat(result.value);
      if (isNaN(valor)) return;
      fetch(`${API_URL}/productos/${producto.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...producto, [campo]: valor }),
      }).then(() => {
        setProductos(prev =>
          prev.map(p => p.id === producto.id ? { ...p, [campo]: valor } : p)
        );
      });
    });
  };

  const eliminarProducto = (producto) => {
    MySwal.fire({
      title: `¿Eliminar "${producto.nombre}"?`,
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then(result => {
      if (!result.isConfirmed) return;
      fetch(`${API_URL}/productos/${producto.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).then(() => {
        setProductos(prev => prev.filter(p => p.id !== producto.id));
      });
    });
  };

  const agregarProducto = () => {
    MySwal.fire({
      title: "Nuevo Producto",
      html: `
      <input id="nombre" class="swal2-input" placeholder="Nombre">
      <input id="codigo" class="swal2-input" placeholder="Código">
      <input id="descripcion" class="swal2-input" placeholder="Descripción">
      <input id="stock" type="number" class="swal2-input" placeholder="Stock">
      <input id="precio" type="number" class="swal2-input" placeholder="Precio">
      <input id="categoria" type="number" class="swal2-input" placeholder="Categoría ID" value="1">
      <input id="imagen" type="file" class="swal2-file">`,
      showCancelButton: true,
      confirmButtonText: "Agregar",
      preConfirm: () => {
        const nombre = document.getElementById("nombre").value;
        const codigo = document.getElementById("codigo").value;
        const descripcion = document.getElementById("descripcion").value;
        const stock = document.getElementById("stock").value;
        const precio = document.getElementById("precio").value;
        const categoria = document.getElementById("categoria").value;
        const imagen = document.getElementById("imagen").files[0];

        if (!nombre || !codigo || !precio || !imagen) {
          Swal.showValidationMessage("Faltan campos obligatorios o imagen");
          return false;
        }

        const formData = new FormData();
        formData.append("nombre", nombre);
        formData.append("codigo", codigo);
        formData.append("descripcion", descripcion);
        formData.append("stock_actual", stock);
        formData.append("precio_unitario", precio);
        formData.append("categoria_id", categoria);
        formData.append("activo", true);
        formData.append("file", imagen);

        return formData;
      }
    }).then(result => {
      if (!result.isConfirmed || !result.value) return;

      fetch(`${API_URL}/productos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: result.value,
      })
        .then(res => res.json())
        .then(nuevoProducto => {
          setProductos(prev => [...prev, nuevoProducto]);
        })
        .catch(err => {
          console.error("Error al crear producto:", err);
          Swal.fire("Error", "No se pudo agregar el producto", "error");
        });
    });
  };


  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-lexend-medium text-[#5170FF]">Productos</h2>
        <button
          onClick={agregarProducto}
          className="flex items-center gap-2 bg-[#5170FF] text-white px-4 py-2 rounded-md hover:bg-[#3f5be0] transition"
        >
          <FontAwesomeIcon icon={faPlus} /> Agregar
        </button>
      </div>

      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
        {productos.map(p => (
          <div
            key={p.id}
            className="bg-white rounded-lg shadow p-3 w-full min-h-[240px] flex flex-col justify-between relative border border-gray-200 hover:shadow-md transition"
          >
            <img
              src={p.image_url ? `${API_URL}${p.image_url}` : "https://via.placeholder.com/150x100?text=Sin+Imagen"}
              alt={p.nombre}
              className="w-full h-28 object-contain rounded bg-white mb-2"
            />
            <h3 className="text-sm font-semibold text-gray-800">{p.nombre}</h3>
            <p className="text-xs text-gray-600">Código: {p.codigo}</p>
            <p className="text-xs text-gray-600">Stock: {p.stock_actual}</p>
            <p className="text-xs text-gray-600 mb-1">
              Precio: ${p.precio_unitario ? p.precio_unitario.toFixed(2) : "0.00"}
            </p>

            <div className="absolute top-2 right-2">
              <button
                className="text-gray-500 hover:text-gray-800 p-2"
                onClick={() =>
                  MySwal.fire({
                    title: "Opciones",
                    showDenyButton: true,
                    showCancelButton: true,
                    showCloseButton: true,
                    confirmButtonText: "Editar stock",
                    denyButtonText: "Editar precio",
                    cancelButtonText: "Eliminar",
                  }).then(result => {
                    if (result.isConfirmed) editarCampo(p, "stock_actual");
                    else if (result.isDenied) editarCampo(p, "precio_unitario");
                    else if (result.dismiss === Swal.DismissReason.cancel) eliminarProducto(p);
                  })
                }
              >
                <FontAwesomeIcon icon={faEllipsisV} size="lg" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
