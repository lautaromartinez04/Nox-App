import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

const API_URL = import.meta.env.VITE_API_URL;

export const ProductoItem = () => {
  const { id } = useParams(); // "nuevo" o un ID
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState({
    nombre: "",
    codigo: "",
    descripcion: "",
    stock_actual: 0,
    precio_unitario: 0,
    categoria_id: 1,
    activo: true,
    file: null,
  });

  useEffect(() => {
    if (id && id !== "nuevo") {
      fetch(`${API_URL}/productos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setForm({ ...data, file: null }))
        .catch(console.error);
    }
  }, [id]);

  useEffect(() => {
    fetch(`${API_URL}/categorias`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setCategorias)
      .catch(console.error);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") setForm({ ...form, [name]: checked });
    else if (type === "file") setForm({ ...form, file: files[0] });
    else setForm({ ...form, [name]: value });
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
      // siempre FormData para PUT y POST
      Object.entries(form).forEach(([key, val]) => {
        if (key === "file" && val) formData.append("file", val);
        else if (key !== "file") formData.append(key, val);
      });

      const method = id === "nuevo" ? "POST" : "PUT";
      const url = id === "nuevo" ? `${API_URL}/productos` : `${API_URL}/productos/${id}`;
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error(
        id === "nuevo" ? "Error al crear producto" : "Error al actualizar producto"
      );

      showAlert(
        id === "nuevo" ? "Producto creado" : "Producto actualizado",
        id === "nuevo"
          ? "El producto se creó correctamente."
          : "Los cambios se guardaron con éxito."
      );

      navigate("/productos");
    } catch (err) {
      console.error(err);
      showAlert("Error", err.message || "Ocurrió un error", "error");
    }
  };

  return (
    <div className="w-full px-6 py-4">
      <h2 className="text-2xl font-bold mb-6 text-[#5170FF]">
        {id === "nuevo" ? "Nuevo Producto" : "Editar Producto"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="nombre" className="block text-lexend-medium text-gray-700">
            Nombre
          </label>
          <input
            id="nombre"
            name="nombre"
            placeholder="Ingresá el nombre"
            value={form.nombre}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label htmlFor="codigo" className="block text-lexend-medium text-gray-700">
            Código
          </label>
          <input
            id="codigo"
            name="codigo"
            placeholder="Ingresá el código"
            value={form.codigo}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

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

        <div>
          <label htmlFor="stock_actual" className="block text-lexend-medium text-gray-700">
            Stock
          </label>
          <input
            id="stock_actual"
            name="stock_actual"
            type="number"
            value={form.stock_actual}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label htmlFor="precio_unitario" className="block text-lexend-medium text-gray-700">
            Precio Unitario
          </label>
          <input
            id="precio_unitario"
            name="precio_unitario"
            type="number"
            value={form.precio_unitario}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

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
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="activo"
            name="activo"
            type="checkbox"
            checked={form.activo}
            onChange={handleChange}
            className="h-4 w-4"
          />
          <label htmlFor="activo" className="text-lexend-medium text-gray-700">
            Activo
          </label>
        </div>

        <div className="col-span-1 md:col-span-2">
          <label htmlFor="file" className="block text-lexend-medium text-gray-700">
            Imagen del producto
          </label>
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

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-300 text-[#5170FF] border-2 border-[#5170FF] rounded hover:bg-[#5170FF] hover:text-white transition text-lexend-medium"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-[#5170FF] text-white rounded hover:bg-[#3f5be0] transition text-lexend-medium"
        >
          Guardar
        </button>
      </div>
    </div>
  );
};
