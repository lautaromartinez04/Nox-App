// src/components/routers/categorias/Categorias.jsx

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'

const MySwal = withReactContent(Swal)
const API_URL = import.meta.env.VITE_API_URL

export const Categorias = () => {
  const [categorias, setCategorias] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  // Fetch categories
  const fetchCategorias = () => {
    fetch(`${API_URL}/categorias`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : Promise.reject('Error cargando categorías'))
      .then(data => setCategorias(data))
      .catch(err => {
        console.error(err)
        MySwal.fire({
          title: 'Error',
          text: 'No se pudieron cargar las categorías.',
          icon: 'error',
          customClass: {
            popup: 'text-lexend-regular',
            title: 'text-lexend-extrabold text-[#5170FF]',
            confirmButton: 'bg-[#5170FF] hover:bg-[#3f5be0] text-white text-lexend-medium',
          },
        })
      })
  }
  useEffect(fetchCategorias, [token])

  // Delete category
  const handleDelete = id => {
    MySwal.fire({
      title: '¿Eliminar categoría?',
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
      fetch(`${API_URL}/categorias/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          if (!res.ok) throw new Error()
          MySwal.fire({
            title: '¡Eliminada!',
            text: 'La categoría fue eliminada.',
            icon: 'success',
            customClass: {
              popup: 'text-lexend-regular',
              title: 'text-lexend-extrabold text-[#5170FF]',
              confirmButton: 'bg-[#5170FF] hover:bg-[#3f5be0] text-white text-lexend-medium',
            },
          })
          fetchCategorias()
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

  // Filter by search term
  const filtered = categorias.filter(cat => {
    const term = searchTerm.toLowerCase()
    return (
      cat.nombre.toLowerCase().includes(term) ||
      cat.id.toString().includes(term)
    )
  })

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize) || 1
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="p-6 overflow-x-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-xl font-bold text-lexend-medium text-[#5170FF]">Categorías</h2>
        <button
          onClick={() => navigate("/categorias/nuevo")}
          className="flex items-center gap-2 bg-[#5170FF] text-white px-4 py-2 rounded-md hover:bg-[#3f5be0] transition text-lexend-medium"
        >
          <FontAwesomeIcon icon={faPlus} /> Agregar
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm">Buscar ID/Nombre:</label>
          <input
            type="text"
            placeholder="Nombre o ID"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setPage(1) }}
            className="mt-1 p-2 border rounded w-full"
          />
        </div>
        <div>
          <label className="block text-sm">Filas por página:</label>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
            className="mt-1 p-2 border rounded"
          >
            {[10,20,50,100].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      <table className="min-w-full bg-white rounded-lg shadow">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="px-4 py-2 text-lexend-medium text-left">ID</th>
            <th className="px-4 py-2 text-lexend-medium text-left">Nombre</th>
            <th className="px-4 py-2 text-lexend-medium text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map(cat => (
            <tr key={cat.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2">{cat.id}</td>
              <td className="px-4 py-2">{cat.nombre}</td>
              <td className="px-4 py-2 space-x-4">
                <button
                  onClick={() => navigate(`/categorias/${cat.id}`)}
                  className="text-[#5170FF] hover:underline text-lexend-medium transition"
                >Editar</button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="text-red-500 hover:underline text-lexend-medium transition"
                >Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm">Página {page} de {totalPages} (Total {filtered.length})</span>
        <div className="space-x-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >Anterior</button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >Siguiente</button>
        </div>
      </div>
    </div>
  )
}
