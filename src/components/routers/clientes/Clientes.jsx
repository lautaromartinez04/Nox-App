import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)
const API_URL = import.meta.env.VITE_API_URL

export const Clientes = () => {
  const [clientes, setClientes] = useState([])
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const fetchClientes = () => {
    fetch(`${API_URL}/clientes`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Error cargando clientes')
        return res.json()
      })
      .then(setClientes)
      .catch(err => {
        console.error(err)
        MySwal.fire({
          title: 'Error',
          text: 'No se pudieron cargar los clientes.',
          icon: 'error',
          customClass: {
            popup: 'text-lexend-regular',
            title: 'text-lexend-extrabold text-[#5170FF]',
            confirmButton: 'bg-[#5170FF] hover:bg-[#3f5be0] text-white text-lexend-medium',
          },
        })
      })
  }

  useEffect(fetchClientes, [])

  const handleDelete = id => {
    MySwal.fire({
      title: '¿Eliminar cliente?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No',
      customClass: {
        popup: 'text-lexend-regular',
        title: 'text-lexend-extrabold text-[#5170FF]',
        confirmButton: 'bg-[#5170FF] hover:bg-[#3f5be0] text-white text-lexend-medium',
        cancelButton: 'bg-gray-300 hover:bg-gray-400 text-gray-700 text-lexend-medium',
      },
    }).then(result => {
      if (!result.isConfirmed) return
      fetch(`${API_URL}/clientes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          if (!res.ok) throw new Error()
          MySwal.fire({
            title: '¡Eliminado!',
            text: 'El cliente fue eliminado.',
            icon: 'success',
            customClass: {
              popup: 'text-lexend-regular',
              title: 'text-lexend-extrabold text-[#5170FF]',
              confirmButton: 'bg-[#5170FF] hover:bg-[#3f5be0] text-white text-lexend-medium',
            },
          })
          fetchClientes()
        })
        .catch(() => {
          MySwal.fire({
            title: 'Error',
            text: 'No se pudo eliminar.',
            icon: 'error',
            customClass: {
              popup: 'text-lexend-regular',
              title: 'text-lexend-extrabold text-[#5170FF]',
              confirmButton: 'bg-[#5170FF] hover:bg-[#3f5be0] text-white text-lexend-medium',
            },
          })
        })
    })
  }

  return (
    <div className="p-6 overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-lexend-medium text-[#5170FF]">Clientes</h2>
        <button
          onClick={() => navigate("/clientes/nuevo")}
          className="flex items-center gap-2 bg-[#5170FF] text-white px-4 py-2 rounded-md hover:bg-[#3f5be0] transition text-lexend-medium"
        >
          <FontAwesomeIcon icon={faPlus} /> Agregar
        </button>
      </div>

      <table className="min-w-full bg-white rounded-lg shadow">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="px-4 py-2 text-lexend-medium text-left">ID</th>
            <th className="px-4 py-2 text-lexend-medium text-left">Nombre</th>
            <th className="px-4 py-2 text-lexend-medium text-left">Documento</th>
            <th className="px-4 py-2 text-lexend-medium text-left">Dirección</th>
            <th className="px-4 py-2 text-lexend-medium text-left">Teléfono</th>
            <th className="px-4 py-2 text-lexend-medium text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map(c => (
            <tr key={c.id} className="border-b last:border-b-0 hover:bg-gray-50">
              <td className="px-4 py-2">{c.id}</td>
              <td className="px-4 py-2">{c.nombre}</td>
              <td className="px-4 py-2">{c.documento}</td>
              <td className="px-4 py-2">{c.direccion}</td>
              <td className="px-4 py-2">{c.telefono}</td>
              <td className="px-4 py-2 space-x-4">
                <button
                  onClick={() => navigate(`/clientes/${c.id}`)}
                  className="text-[#5170FF] hover:underline text-lexend-medium transition"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-red-500 hover:underline text-lexend-medium transition"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
