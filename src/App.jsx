import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/navbar/Navbar';
import { Login } from './components/login/Login';

import { Inicio } from './components/routers/inicio/Inicio';


import { Productos } from './components/routers/productos/Productos';
import { ProductoItem } from './components/routers/productos/ProductoItem';

import { Ventas } from './components/routers/ventas/Ventas';
import { VentasItem } from './components/routers/ventas/VentasItem';

import { Clientes } from './components/routers/clientes/Clientes';
import { ClientesItem } from './components/routers/clientes/ClientesItem';

import { Categorias } from './components/routers/categorias/Categorias';
import { CategoriaItem } from './components/routers/categorias/CategoriaItem';

import { Devoluciones } from './components/routers/devoluciones/Devoluciones';
import { NuevaDevolucion } from './components/routers/devoluciones/NuevaDevolucion';
import { DevolucionItem } from './components/routers/devoluciones/DevolucionItem';

import { Gastos } from './components/routers/gastos/Gastos';
import { GastoItem } from './components/routers/gastos/GastosItem';

import { Reportes } from './components/routers/reportes/Reportes';
import { ReporteImprimible } from './components/routers/reportes/ReporteImprimible';

import Logo from './media/images/login/Logo.png'; // Cambiá la ruta según corresponda
import { Pos } from './components/routers/POS/Pos';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex print:flex-col bg-[#f8f9fc]">
      <div className="print:hidden">
        <Navbar />
      </div>
      <div className="flex flex-col flex-1 ml-16">
        {/* Navbar superior */}
        <header className="h-16 bg-white shadow px-4 flex items-center justify-between fixed top-0 left-16 right-0 z-30 print:hidden">
          <span className="text-[#5170FF] text-xl font-semibold text-lexend-extrabold">NOX</span>
          <button
            onClick={handleLogout}
            className="bg-[#5170FF] hover:bg-[#3f5be0] text-white px-4 py-2 rounded-md text-sm font-medium transition"
          >
            Cerrar sesión
          </button>
        </header>

        {/* Contenido */}
        <div className="mt-16 p-4 print:w-full">
          <Routes>
            <Route path='/' element={<Pos />} />

            <Route path="/inicio" element={<Inicio />} />

            <Route path="/productos" element={<Productos />} />
            <Route path="/productos/:id" element={<ProductoItem />} />

            <Route path="/ventas" element={<Ventas />} />
            <Route path="/ventas/:id" element={<VentasItem />} />

            <Route path="/clientes" element={<Clientes />} />
            <Route path="/clientes/:id" element={<ClientesItem />} />

            <Route path="/categorias" element={<Categorias />} />
            <Route path="/categorias/:id" element={<CategoriaItem />} />

            <Route path="/devoluciones" element={<Devoluciones />} />

            {/* Formulario de devolución: primero lista, luego formulario con ventaId */}
            <Route path="/devoluciones/nueva" element={<NuevaDevolucion />} />
            <Route path="/devoluciones/nueva/:ventaId" element={<NuevaDevolucion />} />

            {/* Ver una devolución existente */}
            <Route path="/devoluciones/:id" element={<DevolucionItem />} />

            {/* Gastos */}
            <Route path="/gastos" element={<Gastos />} />
            <Route path="/gastos/nuevo" element={<GastoItem />} />
            <Route path="/gastos/:id" element={<GastoItem />} />

            {/* Reportes */}
            <Route path="/reportes" element={<Reportes />} />
            <Route path="/reportesimprimible" element={<ReporteImprimible />} />

          </Routes>
        </div>
      </div>
    </div>
  );
}
