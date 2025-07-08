import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)
const API_URL = import.meta.env.VITE_API_URL

export const CategoriaItem = () => {
  const { id } = useParams()         // "nuevo" o ID numérico
  const navigate = useNavigate()
  const token   = localStorage.getItem('token')

  const [nombre, setNombre] = useState('')

  useEffect(() => {
    if (id && id !== 'nuevo') {
      fetch(`${API_URL}/categorias/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => setNombre(data.nombre))
        .catch(err => {
          console.error(err)
          MySwal.fire({
            title: 'Error',
            text: 'No se pudo cargar la categoría.',
            icon: 'error',
            customClass: {
              popup: 'text-lexend-regular',
              title: 'text-lexend-extrabold text-[#5170FF]',
              confirmButton: 'bg-[#5170FF] hover:bg-[#3f5be0] text-white text-lexend-medium',
            },
          })
        })
    }
  }, [id])

  const handleSubmit = async () => {
    try {
      const method = id === 'nuevo' ? 'POST' : 'PUT'
      const url    = id === 'nuevo'
        ? `${API_URL}/categorias`
        : `${API_URL}/categorias/${id}`

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nombre }),
      })

      if (!res.ok) throw new Error('Error al guardar categoría')

      await MySwal.fire({
        title: id === 'nuevo' ? 'Creada' : 'Actualizada',
        text: id === 'nuevo'
          ? 'La categoría fue creada correctamente.'
          : 'Los cambios se guardaron con éxito.',
        icon: 'success',
        customClass: {
          popup: 'text-lexend-regular',
          title: 'text-lexend-extrabold text-[#5170FF]',
          confirmButton: 'bg-[#5170FF] hover:bg-[#3f5be0] text-white text-lexend-medium',
        },
      })

      navigate('/categorias')
    } catch (err) {
      console.error(err)
      MySwal.fire({
        title: 'Error',
        text: err.message || 'Ocurrió un error',
        icon: 'error',
        customClass: {
          popup: 'text-lexend-regular',
          title: 'text-lexend-extrabold text-[#5170FF]',
          confirmButton: 'bg-[#5170FF] hover:bg-[#3f5be0] text-white text-lexend-medium',
        },
      })
    }
  }

  return (
    <div className="w-full px-6 py-4">
      <h2 className="text-2xl text-lexend-extrabold mb-6 text-[#5170FF]">
        {id === 'nuevo' ? 'Nueva Categoría' : 'Editar Categoría'}
      </h2>

      <div className="mb-4">
        <label htmlFor="nombre" className="block text-lexend-medium text-gray-700 mb-1">
          Nombre
        </label>
        <input
          id="nombre"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          placeholder="Ingresá el nombre"
          className="w-full p-2 border rounded focus:ring-2 focus:ring-[#5170FF]"
        />
      </div>

      <div className="flex justify-between">
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
  )
}
