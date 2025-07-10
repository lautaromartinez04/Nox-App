// src/components/routers/pos/Pos.jsx

import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL;

export const Pos = () => {
  const token = localStorage.getItem('token');

  const [productos, setProductos] = useState([]);
  const [clientes, setClientes]   = useState([]);
  const [cart, setCart]           = useState([]); // each item: { producto_id, nombre, precio_unitario, cantidad, descuento }
  const [globalDesc, setGlobalDesc] = useState(0);
  const [clienteId, setClienteId] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [pending, setPending]     = useState(null);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(true);

  // Carga inicial de productos y clientes
  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/productos`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_URL}/clientes`,  { headers: { Authorization: `Bearer ${token}` } })
    ])
      .then(async ([resP, resC]) => {
        if (!resP.ok) throw new Error('Error cargando productos');
        if (!resC.ok) throw new Error('Error cargando clientes');
        const [prods, clis] = await Promise.all([resP.json(), resC.json()]);
        setProductos(prods);
        setClientes(clis);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  // Añade producto al carrito o incrementa cantidad
  const addToCart = (prod, qty) => {
    setCart(prev => {
      const exists = prev.find(i => i.producto_id === prod.id);
      if (exists) {
        return prev.map(i =>
          i.producto_id === prod.id
            ? { ...i, cantidad: i.cantidad + qty }
            : i
        );
      }
      return [
        ...prev,
        {
          producto_id: prod.id,
          nombre: prod.nombre,
          precio_unitario: prod.precio_unitario,
          cantidad: qty,
          descuento: 0
        }
      ];
    });
  };

  const updateQty = (producto_id, qty) => {
    setCart(prev =>
      prev.map(i =>
        i.producto_id === producto_id
          ? { ...i, cantidad: Math.max(1, qty) }
          : i
      )
    );
  };

  const updateDiscount = (producto_id, desc) => {
    setCart(prev =>
      prev.map(i =>
        i.producto_id === producto_id
          ? { ...i, descuento: Math.min(Math.max(0, desc), 100) }
          : i
      )
    );
    // if any line discount > 0, reset global
    if (desc > 0) setGlobalDesc(0);
  };

  const removeFromCart = producto_id => {
    setCart(prev => prev.filter(i => i.producto_id !== producto_id));
  };

  // Calcula subtotales y total
  const subtotal = cart.reduce((sum, i) => {
    const line = i.precio_unitario * i.cantidad * (1 - i.descuento / 100);
    return sum + line;
  }, 0);
  const total = subtotal * (1 - globalDesc / 100);

  const clienteOptions = clientes.map(c => ({
    value: c.id,
    label: `${c.nombre} (#${c.id})`
  }));

  const handleKeyDown = e => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    setError('');
    const text = inputValue.trim();
    if (pending && text === pending.raw) {
      addToCart(pending.producto, pending.cantidad);
      setPending(null);
      setInputValue('');
      return;
    }
    setPending(null);
    const m = text.match(/^(?:(\d+)[xX\*])?(.+)$/);
    if (!m) {
      setError('Formato inválido');
      return;
    }
    const qty  = m[1] ? Number(m[1]) : 1;
    if (qty < 1) {
      setError('Cantidad mínima 1');
      return;
    }
    const code = m[2].trim();
    const prod = productos.find(p => p.codigo === code);
    if (!prod) {
      setError(`No hallado código "${code}"`);
      return;
    }
    setPending({ producto: prod, cantidad: qty, raw: text });
  };

  const handleSubmit = async () => {
    if (!clienteId) {
      setError('Selecciona un cliente');
      return;
    }
    if (cart.length === 0) {
      setError('Carrito vacío');
      return;
    }
    try {
      const payload = {
        cliente_id: clienteId,
        usuario_id: 1,
        descuento: globalDesc,
        detalles: cart.map(i => ({
          producto_id:    i.producto_id,
          cantidad:       i.cantidad,
          precio_unitario:i.precio_unitario,
          subtotal:       i.precio_unitario * i.cantidad * (1 - i.descuento / 100),
          descuento:      i.descuento
        }))
      };
      const res = await fetch(`${API_URL}/ventas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Error al crear venta');
      }
      Swal.fire({
        title: 'Venta realizada',
        text: 'Operación exitosa.',
        icon: 'success',
        confirmButtonText: 'OK',
        customClass: {
          title: 'text-lexend-extrabold text-[#5170FF]',
          confirmButton: 'bg-[#5170FF] text-white'
        }
      });
      // resetear
      setCart([]);
      setClienteId(null);
      setGlobalDesc(0);
      setInputValue('');
      setPending(null);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <p className="p-6">Cargando POS…</p>;
  }

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Izquierda: Escaneo, Cliente y Global Discount */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        {/* Escaneo */}
        <div>
          <h2 className="text-lg font-bold text-[#5170FF] mb-2">Escanear / Código</h2>
          <input
            type="text"
            placeholder="Ej: 3xABC123 o ABC123"
            value={inputValue}
            onChange={e => { setError(''); setPending(null); setInputValue(e.target.value); }}
            onKeyDown={handleKeyDown}
            className="w-full p-2 border rounded"
          />
          {pending && (
            <div className="p-2 bg-yellow-50 border-l-4 border-yellow-400 mt-2">
              <p><strong>Confirmar:</strong> {pending.cantidad}× {pending.producto.nombre}</p>
              <p className="text-sm text-gray-600">Enter para confirmar</p>
            </div>
          )}
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
        {/* Cliente + Global Discount */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm mb-1">Cliente</label>
            <Select
              options={clienteOptions}
              value={clienteOptions.find(o => o.value === clienteId) || null}
              onChange={opt => setClienteId(opt.value)}
              placeholder="Selecciona..."
              isClearable
            />
          </div>
          <div className="w-32">
            <label className="block text-sm mb-1">Desc. Global %</label>
            <input
              type="number"
              min="0"
              max="100"
              value={globalDesc}
              onChange={e => setGlobalDesc(Number(e.target.value))}
              disabled={cart.some(i => i.descuento > 0)}
              className="w-full p-2 border rounded disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Derecha: Carrito con per-item discount */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-col">
        <h2 className="text-lg font-bold text-[#5170FF] mb-2">Carrito</h2>
        <div className="flex-1 overflow-y-auto mb-4">
          {cart.length === 0 ? (
            <p className="text-gray-600">No hay artículos</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">Producto</th>
                  <th className="text-center">Cant.</th>
                  <th className="text-center">Desc. %</th>
                  <th className="text-right">Subtotal</th>
                  <th/>
                </tr>
              </thead>
              <tbody>
                {cart.map(item => {
                  const lineTotal = item.precio_unitario * item.cantidad * (1 - item.descuento/100);
                  return (
                    <tr key={item.producto_id} className="border-t">
                      <td>{item.nombre}</td>
                      <td className="text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.cantidad}
                          onChange={e => updateQty(item.producto_id, Number(e.target.value))}
                          className="w-12 text-center border rounded px-1"
                        />
                      </td>
                      <td className="text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.descuento}
                          onChange={e => updateDiscount(item.producto_id, Number(e.target.value))}
                          className="w-12 text-center border rounded px-1"
                        />
                      </td>
                      <td className="text-right">${lineTotal.toFixed(2)}</td>
                      <td className="text-center">
                        <button onClick={() => removeFromCart(item.producto_id)}>
                          <FontAwesomeIcon icon={faTrash} className="text-red-500" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Totales */}
        <div className="mt-auto space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span><span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total:</span><span>${total.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-[#5170FF] text-white py-2 rounded hover:bg-[#3f5be0] transition"
        >
          <FontAwesomeIcon icon={faCheckCircle} /> Confirmar Venta
        </button>
      </div>
    </div>
  );
};
