import React, { useEffect, useState, useRef } from 'react';
import Select from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faCheckCircle, faPrint } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import { useReactToPrint } from 'react-to-print';
import { Ticket } from '../ticket/Ticket';

const API_URL = import.meta.env.VITE_API_URL;

export const Pos = () => {
  const token = localStorage.getItem('token');

  const [productos, setProductos] = useState([]);
  const [clientes, setClientes]   = useState([]);
  const [cart, setCart]           = useState([]);
  const [globalDesc, setGlobalDesc] = useState(0);
  const [clienteId, setClienteId] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [pending, setPending]     = useState(null);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(true);
  const [logoData, setLogoData]   = useState('');

  const ticketRef = useRef();
  const handlePrint = useReactToPrint({
    contentRef: ticketRef,
    documentTitle: 'Ticket'
  });

  useEffect(() => {
    // Carga productos y clientes
    Promise.all([
      fetch(`${API_URL}/productos`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_URL}/clientes`,  { headers: { Authorization: `Bearer ${token}` } })
    ])
      .then(async ([rP, rC]) => {
        if (!rP.ok || !rC.ok) throw new Error('Error cargando datos');
        const [prods, clis] = await Promise.all([rP.json(), rC.json()]);
        setProductos(prods);
        setClientes(clis);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));

    // Precarga logo como Base64
    (async () => {
      try {
        const res = await fetch(window.location.origin + '/Logo.png');
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => setLogoData(reader.result);
        reader.readAsDataURL(blob);
      } catch {}
    })();
  }, [token]);

  const addToCart = (prod, qty) => {
    setCart(prev => {
      const ex = prev.find(i => i.producto_id === prod.id);
      if (ex) {
        return prev.map(i =>
          i.producto_id === prod.id
            ? { ...i, cantidad: i.cantidad + qty }
            : i
        );
      }
      return [...prev, {
        producto_id: prod.id,
        nombre: prod.nombre,
        precio_unitario: prod.precio_unitario,
        cantidad: qty,
        descuento_individual: 0
      }];
    });
  };

  const updateQty = (id, qty) =>
    setCart(prev => prev.map(i =>
      i.producto_id === id
        ? { ...i, cantidad: Math.max(1, qty) }
        : i
    ));

  const updateDiscount = (id, d) => {
    const clean = Math.min(Math.max(0, d), 100);
    setCart(prev => prev.map(i =>
      i.producto_id === id
        ? { ...i, descuento_individual: clean }
        : i
    ));
    if (clean > 0) setGlobalDesc(0);
  };

  const removeFromCart = id =>
    setCart(prev => prev.filter(i => i.producto_id !== id));

  const handleKeyDown = e => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    setError('');
    const t = inputValue.trim();
    if (pending && t === pending.raw) {
      addToCart(pending.producto, pending.cantidad);
      setPending(null);
      setInputValue('');
      return;
    }
    setPending(null);
    const m = t.match(/^(?:(\d+)[xX\*])?(.+)$/);
    if (!m) return setError('Formato inválido');
    const qty = m[1] ? Number(m[1]) : 1;
    if (qty < 1) return setError('Cantidad mínima 1');
    const code = m[2].trim();
    const prod = productos.find(p => p.codigo === code);
    if (!prod) return setError(`No hallado código "${code}"`);
    if (qty > prod.stock_actual)
      return setError(`Solo quedan ${prod.stock_actual} unidades de "${prod.nombre}"`);
    setPending({ producto: prod, cantidad: qty, raw: t });
  };

  const subtotal = cart.reduce((s, i) => {
    const net = i.precio_unitario * (1 - i.descuento_individual/100);
    return s + net * i.cantidad;
  }, 0);
  const total   = subtotal * (1 - globalDesc/100);
  const cliente  = clientes.find(c => c.id === clienteId);
  const fecha    = new Date().toLocaleString();
  const clienteOptions = clientes.map(c => ({ value: c.id, label: `${c.nombre} (#${c.id})` }));

  const handleSubmit = async () => {
    if (!clienteId) return setError('Selecciona un cliente');
    if (!cart.length)  return setError('Carrito vacío');
    try {
      const payload = {
        cliente_id: clienteId,
        usuario_id: 1,
        descuento: globalDesc,
        detalles: cart.map(i => ({
          producto_id: i.producto_id,
          cantidad: i.cantidad,
          precio_unitario: i.precio_unitario * (1 - i.descuento_individual/100),
          subtotal: i.precio_unitario * i.cantidad * (1 - i.descuento_individual/100),
          descuento_individual: i.descuento_individual
        }))
      };
      const res = await fetch(`${API_URL}/ventas`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Error al crear venta');

      await Swal.fire({
        title:'Venta realizada',
        text:'Operación exitosa.',
        icon:'success',
        confirmButtonText:'OK',
        customClass:{
          title:'text-lexend-extrabold text-[#5170FF]',
          confirmButton:'bg-[#5170FF] text-white'
        }
      });

      handlePrint();
      setCart([]); setClienteId(null); setGlobalDesc(0);
      setInputValue(''); setPending(null); setError('');
    } catch(e) {
      setError(e.message);
    }
  };

  if (loading) return <p className="p-6">Cargando POS…</p>;

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Panel izquierdo */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <h2 className="text-lg font-bold text-[#5170FF] mb-2">Escanear / Código</h2>
        <input
          type="text"
          placeholder="Ej: 3xABC123 o ABC123"
          value={inputValue}
          onChange={e=>{ setError(''); setPending(null); setInputValue(e.target.value); }}
          onKeyDown={handleKeyDown}
          className="w-full p-2 border rounded"
        />
        {pending && (
          <div className="p-2 bg-yellow-50 border-l-4 border-yellow-400 mt-2">
            <p><strong>Confirmar:</strong> {pending.cantidad}× {pending.producto.nombre}</p>
            {pending.producto.stock_actual <= pending.producto.stock_bajo && (
              <p className="text-sm text-red-600">¡Stock bajo: quedan {pending.producto.stock_actual}!</p>
            )}
            <p className="text-sm text-gray-600">Enter para confirmar</p>
          </div>
        )}
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm mb-1">Cliente</label>
            <Select
              options={clienteOptions}
              value={clienteOptions.find(o=>o.value===clienteId)||null}
              onChange={opt=>setClienteId(opt.value)}
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
              onChange={e=>setGlobalDesc(Number(e.target.value))}
              disabled={cart.some(i=>i.descuento_individual>0)}
              className="w-full p-2 border rounded disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-col">
        <h2 className="text-lg font-bold text-[#5170FF] mb-2">Carrito</h2>
        <div className="flex-1 overflow-y-auto mb-4">
          {cart.length===0
            ? <p className="text-gray-600">No hay artículos</p>
            : <table className="w-full text-sm">
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
                  {cart.map(i=> {
                    const net=(i.precio_unitario*(1-i.descuento_individual/100)).toFixed(2);
                    const lt=(net*i.cantidad).toFixed(2);
                    return (
                      <tr key={i.producto_id} className="border-t">
                        <td>{i.nombre}</td>
                        <td className="text-center">
                          <input
                            type="number"
                            min="1"
                            value={i.cantidad}
                            onChange={e=>updateQty(i.producto_id,Number(e.target.value))}
                            className="w-12 text-center border rounded px-1"
                          />
                        </td>
                        <td className="text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={i.descuento_individual}
                            onChange={e=>updateDiscount(i.producto_id,Number(e.target.value))}
                            className="w-12 text-center border rounded px-1"
                          />
                        </td>
                        <td className="text-right">${lt}</td>
                        <td className="text-center">
                          <button onClick={()=>removeFromCart(i.producto_id)}>
                            <FontAwesomeIcon icon={faTrash} className="text-red-500" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
          }
        </div>
        <div className="mt-auto space-y-2">
          <div className="flex justify-between"><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold"><span>Total:</span><span>${total.toFixed(2)}</span></div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSubmit}
            className="flex-1 flex items-center justify-center gap-2 bg-[#5170FF] text-white py-2 rounded hover:bg-[#3f5be0] transition"
          >
            <FontAwesomeIcon icon={faCheckCircle} /> Confirmar Venta
          </button>
          <button
            onClick={handlePrint}
            disabled={!cart.length}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faPrint} /> Imprimir Ticket
          </button>
        </div>
      </div>

      {/* Ticket oculto para impresión */}
      <div style={{ position: 'absolute', top: -10000, left: -10000 }}>
        <Ticket
          ref={ticketRef}
          cart={cart}
          cliente={cliente}
          fecha={fecha}
          total={total}
          logoData={logoData}
        />
      </div>
    </div>
  );
};
