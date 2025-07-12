import React from 'react';

export const Ticket = React.forwardRef(function Ticket({ cart, cliente, fecha, total, logoData }, ref) {
  return (
    <div ref={ref} style={{ padding: '10px', fontFamily: 'Arial, sans-serif', width: '280px' }}>
      {logoData && (
        <img
          src={logoData}
          alt="Logo NOX"
          style={{ display: 'block', margin: '0 auto 8px', width: '80px' }}
        />
      )}
      <div style={{ textAlign: 'center', marginBottom: '6px' }}>
        <h2 style={{ margin: 0 }}>NOX</h2>
        <small>¡Gracias por tu compra!</small>
      </div>
      <div style={{ fontSize: '11px', marginBottom: '6px' }}>
        <p style={{ margin: '2px 0' }}>
          <strong>Cliente:</strong> {cliente?.nombre || 'Final'}
        </p>
        <p style={{ margin: '2px 0' }}>
          <strong>Fecha:</strong> {fecha}
        </p>
      </div>
      <hr style={{ border: 'none', borderTop: '1px dashed #333', margin: '6px 0' }} />
      {cart.map(i => {
        const net = (i.precio_unitario * (1 - i.descuento_individual / 100)).toFixed(2);
        const lineTotal = (net * i.cantidad).toFixed(2);
        return (
          <div key={i.producto_id} style={{ marginBottom: '6px', fontSize: '12px' }}>
            <div
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {i.nombre}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px'
              }}
            >
              <span>{i.cantidad}× ${net}</span>
              <span>${lineTotal}</span>
            </div>
          </div>
        );
      })}
      <hr style={{ border: 'none', borderTop: '1px dashed #333', margin: '6px 0' }} />
      <div style={{ textAlign: 'right', marginTop: '6px', fontSize: '13px', fontWeight: 'bold' }}>
        TOTAL: ${total.toFixed(2)}
      </div>
      <div style={{ textAlign: 'center', marginTop: '8px' }}>
        {logoData && (
          <img
            src={logoData}
            alt="Logo NOX"
            style={{ display: 'block', margin: '0 auto 4px', width: '60px' }}
          />
        )}
        <small>Powered by App NOX</small>
      </div>
    </div>
  );
});
