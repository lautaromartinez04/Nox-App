import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);
const API_URL = import.meta.env.VITE_API_URL;

export const ClientesItem = () => {
  const { id } = useParams(); // "nuevo" o un ID
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    nombre: "",
    documento: "",
    direccion: "",
    telefono: "",
    activo: true,
  });

  useEffect(() => {
    if (id !== "nuevo") {
      fetch(`${API_URL}/clientes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => setForm(data))
        .catch(console.error);
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const method = id === "nuevo" ? "POST" : "PUT";
      const url =
        id === "nuevo"
          ? `${API_URL}/clientes`
          : `${API_URL}/clientes/${id}`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Error al guardar cliente");

      await MySwal.fire({
        title: id === "nuevo" ? "Cliente creado" : "Cliente actualizado",
        text:
          id === "nuevo"
            ? "El cliente ha sido agregado correctamente."
            : "Los cambios se guardaron con éxito.",
        icon: "success",
        customClass: {
          popup: "font-lexend-regular",
          title: "text-lexend-extrabold text-[#5170FF]",
          confirmButton:
            "bg-[#5170FF] hover:bg-[#3f5be0] text-white font-lexend-medium",
        },
      });

      navigate("/clientes");
    } catch (err) {
      console.error(err);
      await MySwal.fire({
        title: "Error",
        text: err.message || "Ocurrió un error",
        icon: "error",
        customClass: {
          popup: "font-lexend-regular",
          title: "text-lexend-extrabold text-[#5170FF]",
          confirmButton:
            "bg-[#5170FF] hover:bg-[#3f5be0] text-white font-lexend-medium",
        },
      });
    }
  };

  return (
    <div className="w-full px-6 py-4">
      <h2 className="text-2xl font-bold mb-6 text-[#5170FF] text-lexend-extrabold">
        {id === "nuevo" ? "Nuevo Cliente" : "Editar Cliente"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nombre */}
        <div>
          <label htmlFor="nombre" className="block mb-1 text-lexend-medium text-gray-700">
            Nombre
          </label>
          <input
            id="nombre"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-[#5170FF]"
          />
        </div>

        {/* Documento */}
        <div>
          <label htmlFor="documento" className="block mb-1 text-lexend-medium text-gray-700">
            Documento
          </label>
          <input
            id="documento"
            name="documento"
            value={form.documento}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-[#5170FF]"
          />
        </div>

        {/* Dirección */}
        <div className="col-span-1 md:col-span-2">
          <label htmlFor="direccion" className="block mb-1 text-lexend-medium text-gray-700">
            Dirección
          </label>
          <input
            id="direccion"
            name="direccion"
            value={form.direccion}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-[#5170FF]"
          />
        </div>

        {/* Teléfono */}
        <div>
          <label htmlFor="telefono" className="block mb-1 text-lexend-medium text-gray-700">
            Teléfono
          </label>
          <input
            id="telefono"
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-[#5170FF]"
          />
        </div>

        {/* Activo */}
        <div className="flex items-center mt-4">
          <input
            id="activo"
            name="activo"
            type="checkbox"
            checked={form.activo}
            onChange={handleChange}
            className="h-4 w-4 text-[#5170FF] focus:ring-[#5170FF]"
          />
          <label htmlFor="activo" className="ml-2 text-lexend-medium text-gray-700">
            Activo
          </label>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-300 text-[#5170FF] border-2 border-[#5170FF] rounded hover:bg-[#5170FF] hover:text-white transition text-lexend-medium"
        >
          Cancelar
        </button>
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
