// src/components/routers/gastos/GastoItem.jsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faTrash, faEdit, faSave } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL;

// Helper para extraer el "id" del usuario desde el JWT en localStorage
function getUserIdFromToken() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id;
  } catch {
    return null;
  }
}

export const GastoItem = () => {
  const { id } = useParams();
  const isNew = id === undefined;
  const [isEditing, setIsEditing] = useState(isNew);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userId = getUserIdFromToken();

  const [gasto, setGasto] = useState({
    monto: 0,
    descripcion: ''
  });
  const [usuario, setUsuario] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!isNew);

  // 1) Cuando no es nuevo, cargo datos existentes
  useEffect(() => {
    if (!isNew) {
      setLoading(true);
      fetch(`${API_URL}/gastos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error('Gasto no encontrado');
          return res.json();
        })
        .then(data => {
          setGasto({
            monto: data.monto,
            descripcion: data.descripcion || ''
          });
          return fetch(`${API_URL}/usuarios/${data.usuario_id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        })
        .then(res => res.ok ? res.json() : null)
        .then(setUsuario)
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [isNew, id, token]);

  // 2) Crear o actualizar
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!userId) {
      setError('Usuario no autenticado');
      return;
    }

    try {
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew
        ? `${API_URL}/gastos`
        : `${API_URL}/gastos/${id}`;

      const payload = {
        monto: Number(gasto.monto),
        descripcion: gasto.descripcion,
        usuario_id: userId
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.detail || 'Error al guardar');
      }

      Swal.fire('Guardado', 'El gasto se ha guardado correctamente.', 'success');
      if (isNew) {
        navigate('/gastos');
      } else {
        setIsEditing(false);
      }

    } catch (err) {
      setError(err.message);
    }
  };

  // 3) Eliminar
  const handleDelete = () => {
    Swal.fire({
      title: '¿Eliminar gasto?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      customClass: {
        title: 'text-lexend-extrabold text-[#5170FF]',
        confirmButton: 'bg-[#5170FF] text-white',
        cancelButton: 'bg-gray-300 text-gray-700'
      }
    }).then(result => {
      if (result.isConfirmed) {
        fetch(`${API_URL}/gastos/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => {
            if (res.status === 204) {
              Swal.fire('Eliminado', 'El gasto ha sido eliminado.', 'success');
              navigate('/gastos');
            } else {
              throw new Error('No se pudo eliminar');
            }
          })
          .catch(err => Swal.fire('Error', err.message, 'error'));
      }
    });
  };

  if (loading) {
    return <p className="p-6">Cargando…</p>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow relative">
      {/* Botón Volver */}
      <div className="relative w-full">
        <div className="absolute left-4">
          
        </div>
      </div>

      {isEditing ? (
        /* ====== FORMULARIO CREAR/EDITAR ====== */
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-2xl font-extrabold text-[#5170FF]">
            {isNew ? 'Nuevo Gasto' : `Editar Gasto #${id}`}
          </h2>

          <div>
            <label className="block text-sm font-medium">Monto</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={gasto.monto}
              onChange={e => setGasto(f => ({ ...f, monto: e.target.value }))}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Descripción</label>
            <input
              type="text"
              value={gasto.descripcion}
              onChange={e => setGasto(f => ({ ...f, descripcion: e.target.value }))}
              className="w-full p-2 border rounded"
            />
          </div>

          {error && <p className="text-red-500">{error}</p>}

          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={() => isNew ? navigate('/gastos') : setIsEditing(false)}
              className="px-4 py-2 bg-gray-300 text-[#5170FF] border-2 border-[#5170FF] rounded hover:bg-[#5170FF] hover:text-white transition text-lexend-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gray-300 text-[#5170FF] border-2 border-[#5170FF] rounded hover:bg-[#5170FF] hover:text-white transition text-lexend-medium"
            >
              Guardar
            </button>
          </div>
        </form>

      ) : (
        /* ====== VISTA SOLO LECTURA ====== */
        <>
          <h2 className="text-2xl font-extrabold text-[#5170FF] mb-4">
            Gasto #{id}
          </h2>
          <div className="space-y-2 mb-6 text-gray-700">
            {/* Asumimos que el backend incluye `fecha` en la respuesta */}
            <p><strong>Fecha:</strong> {new Date(gasto.fecha).toLocaleString()}</p>
            <p><strong>Monto:</strong> ${Number(gasto.monto).toFixed(2)}</p>
            <p><strong>Descripción:</strong> {gasto.descripcion || '–'}</p>
            <p><strong>Usuario:</strong> {usuario?.username || `#${userId}`}</p>
          </div>

          <div className="flex gap-2 w-full justify-between">
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-gray-300 text-[#5170FF] border-2 border-[#5170FF] rounded hover:bg-[#5170FF] hover:text-white transition text-lexend-medium"
            >
              <FontAwesomeIcon icon={faEdit} /> Editar
            </button>
            <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-300 text-[#5170FF] border-2 border-[#5170FF] rounded hover:bg-[#5170FF] hover:text-white transition text-lexend-medium"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Volver
          </button>
          </div>
        </>
      )}
    </div>
  );
};
