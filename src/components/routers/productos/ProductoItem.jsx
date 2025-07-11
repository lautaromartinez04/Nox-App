import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

const API_URL = import.meta.env.VITE_API_URL;

export const ProductoItem = () => {
  const { id } = useParams();                // "nuevo" o un ID existente
  const isNew = id === "nuevo";
  const [isEditing, setIsEditing] = useState(isNew);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState({
    nombre: "",
    codigo: "",
    descripcion: "",
    stock_actual: 0,
    stock_bajo: 5,
    precio_costo: 0,
    margen: 25,
    precio_unitario: 0,
    categoria_id: 1,
    activo: true,
    file: null,
    image_url: null
  });

  // Carga inicial de categorías y, si no es nuevo, del producto
  useEffect(() => {
    fetch(`${API_URL}/categorias`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setCategorias)
      .catch(console.error);

    if (!isNew) {
      fetch(`${API_URL}/productos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          setForm({
            ...data,
            file: null
          });
        })
        .catch(console.error);
    }
  }, [id, isNew, token]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setForm(f => ({ ...f, [name]: checked }));
    } else if (type === "file") {
      setForm(f => ({ ...f, file: files[0] }));
    } else {
      let val = type === "number" ? Number(value) : value;
      setForm(f => ({ ...f, [name]: val }));
      // si cambian costo o margen, recalcular precio_unitario en el front
      if (name === "precio_costo" && form.margen >= 0) {
        const precio = parseFloat((val * (1 + form.margen / 100)).toFixed(2));
        setForm(f => ({ ...f, precio_unitario: precio }));
      }
      if (name === "margen" && form.precio_costo >= 0) {
        const precio = parseFloat((form.precio_costo * (1 + val / 100)).toFixed(2));
        setForm(f => ({ ...f, precio_unitario: precio }));
      }
      if (name === "precio_unitario" && form.precio_costo > 0) {
        const margenCalc = parseFloat(((val - form.precio_costo) / form.precio_costo * 100).toFixed(2));
        setForm(f => ({ ...f, margen: margenCalc }));
      }
    }
  };

  const showAlert = (title, text, icon = "success") => {
    Swal.fire({
      title,
      text,
      icon,
      customClass: {
        popup: "font-lexend-regular",
        title: "text-lexend-extrabold text-[#5170FF]",
        confirmButton: "bg-[#5170FF] hover:bg-[#3f5be0] text-white font-lexend-medium",
        cancelButton: "bg-gray-300 hover:bg-gray-400 text-gray-700 font-lexend-medium",
      },
      showCancelButton: icon === "warning",
      confirmButtonText: icon === "warning" ? "Sí" : "OK",
      cancelButtonText: icon === "warning" ? "No" : undefined,
    });
  };

  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (key === "file" && val) {
          formData.append("file", val);
        } else if (key !== "file") {
          formData.append(key, String(val));
        }
      });

      const method = isNew ? "POST" : "PUT";
      const url = isNew
        ? `${API_URL}/productos`
        : `${API_URL}/productos/${id}`;

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        throw new Error(isNew
          ? "Error al crear producto"
          : "Error al actualizar producto"
        );
      }

      showAlert(
        isNew ? "Producto creado" : "Producto actualizado",
        isNew
          ? "El producto se creó correctamente."
          : "Los cambios se guardaron con éxito."
      );

      if (isNew) {
        navigate("/productos");
      } else {
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
      showAlert("Error", err.message || "Ocurrió un error", "error");
    }
  };

  const containerClasses = "w-full px-6 py-4 bg-white rounded-lg shadow";

  // Vista de solo lectura
  if (!isEditing && !isNew) {
    return (
      <div className={containerClasses}>
        <h2 className="text-2xl font-bold mb-4 text-[#5170FF] text-lexend-medium">
          {form.nombre}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <img
            src={
              form.image_url
                ? `${API_URL}${form.image_url}`
                : "https://via.placeholder.com/300x200?text=Sin+Imagen"
            }
            alt={form.nombre}
            className="col-span-1 w-full h-48 object-contain rounded"
          />
          <div className="col-span-1 space-y-2 text-lexend-light">
            <p><strong>Código:</strong> {form.codigo}</p>
            <p><strong>Descripción:</strong> {form.descripcion}</p>
            <p><strong>Stock actual:</strong> {form.stock_actual} </p>
            <p><strong>Aviso de stock bajo:</strong> {form.stock_bajo}</p>
            <p><strong>Precio costo:</strong> ${form.precio_costo.toFixed(2)}</p>
            <p><strong>Precio venta:</strong> ${form.precio_unitario.toFixed(2)}</p>
            <p><strong>Margen:</strong> {form.margen.toFixed(2)}%</p>
            <p>
              <strong>Categoría:</strong>{" "}
              {categorias.find(c => c.id === form.categoria_id)?.nombre}
            </p>
            <p><strong>Activo:</strong> {form.activo ? "Sí" : "No"}</p>
          </div>
        </div>

        <div className="mt-8 flex justify-between w-full">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-300 text-[#5170FF] border-2 border-[#5170FF] rounded hover:bg-[#5170FF] hover:text-white transition text-lexend-medium"
          >
            Volver
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-2 bg-[#5170FF] text-white rounded hover:bg-[#3f5be0] transition text-lexend-medium"
          >
            Editar
          </button>
        </div>
      </div>
    );
  }

  // Formulario para nuevo/edición
  return (
    <div className={containerClasses}>
      <h2 className="text-2xl font-bold mb-4 text-[#5170FF]">
        {isNew ? "Nuevo Producto" : "Editar Producto"}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nombre */}
        <div>
          <label htmlFor="nombre" className="block text-lexend-medium text-gray-700">
            Nombre
          </label>
          <input
            id="nombre"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        {/* Código */}
        <div>
          <label htmlFor="codigo" className="block text-lexend-medium text-gray-700">
            Código
          </label>
          <input
            id="codigo"
            name="codigo"
            value={form.codigo}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        {/* Descripción */}
        <div className="col-span-1 md:col-span-2">
          <label htmlFor="descripcion" className="block text-lexend-medium text-gray-700">
            Descripción
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            rows={3}
            value={form.descripcion}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        {/* Stock actual */}
        <div>
          <label htmlFor="stock_actual" className="block text-lexend-medium text-gray-700">
            Stock actual
          </label>
          <input
            id="stock_actual"
            name="stock_actual"
            type="number"
            min="0"
            value={form.stock_actual}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        {/* Umbral stock_bajo */}
        <div>
          <label htmlFor="stock_bajo" className="block text-lexend-medium text-gray-700">
            Stock bajo
          </label>
          <input
            id="stock_bajo"
            name="stock_bajo"
            type="number"
            min="0"
            value={form.stock_bajo}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        {/* Precio de costo */}
        <div>
          <label htmlFor="precio_costo" className="block text-lexend-medium text-gray-700">
            Precio de costo
          </label>
          <input
            id="precio_costo"
            name="precio_costo"
            type="number"
            min="0"
            step="0.01"
            value={form.precio_costo}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        {/* Margen */}
        <div>
          <label htmlFor="margen" className="block text-lexend-medium text-gray-700">
            Margen (%)
          </label>
          <input
            id="margen"
            name="margen"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={form.margen}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        {/* Precio unitario */}
        <div>
          <label htmlFor="precio_unitario" className="block text-lexend-medium text-gray-700">
            Precio de venta
          </label>
          <input
            id="precio_unitario"
            name="precio_unitario"
            type="number"
            min="0"
            step="0.01"
            value={form.precio_unitario}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        {/* Categoría */}
        <div>
          <label htmlFor="categoria_id" className="block text-lexend-medium text-gray-700">
            Categoría
          </label>
          <select
            id="categoria_id"
            name="categoria_id"
            value={form.categoria_id}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
          </select>
        </div>
        {/* Activo */}
        <div className="flex items-center gap-2">
          <input
            id="activo"
            name="activo"
            type="checkbox"
            checked={form.activo}
            onChange={handleChange}
            className="h-4 w-4"
          />
          <label htmlFor="activo" className="text-lexend-medium text-gray-700">Activo</label>
        </div>
        {/* Imagen */}
        <div className="col-span-1 md:col-span-2">
          <label htmlFor="file" className="block text-lexend-medium text-gray-700">Imagen del producto</label>
          <input
            id="file"
            name="file"
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="w-full"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-between gap-2">
        {!isNew && (
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 bg-gray-300 text-[#5170FF] border-2 border-[#5170FF] rounded hover:bg-[#5170FF] hover:text-white transition text-lexend-medium"
          >
            Cancelar
          </button>
        )}
        {isNew && (
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-300 text-[#5170FF] border-2 border-[#5170FF] rounded hover:bg-[#5170FF] hover:text-white transition text-lexend-medium"
          >
            Cancelar
          </button>
        )}
        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-[#5170FF] text-white rounded hover:bg-[#3f5be0] transition text-lexend-medium"
        >
          Guardar
        </button>
      </div>
    </div>
  );
};
