import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/navbar/Navbar';
import { Login } from './components/login/Login';

import { Inicio } from './components/routers/inicio/Inicio';
import { Productos } from './components/routers/productos/Productos';
import { Ventas } from './components/routers/ventas/Ventas';
import { Clientes } from './components/routers/clientes/Clientes';
import { Categorias } from './components/routers/categorias/Categorias';

import Logo from './media/images/login/Logo.png'; // Cambiá la ruta según corresponda

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
    <div className="flex bg-[#f8f9fc]">
      <Navbar />
      <div className="flex flex-col flex-1 ml-16">
        {/* Navbar superior */}
        <header className="h-16 bg-white shadow px-4 flex items-center justify-between fixed top-0 left-16 right-0 z-30">
          <span className="text-[#5170FF] text-xl font-semibold text-lexend-extrabold">NOX</span>
          <button
            onClick={handleLogout}
            className="bg-[#5170FF] hover:bg-[#3f5be0] text-white px-4 py-2 rounded-md text-sm font-medium transition"
          >
            Cerrar sesión
          </button>
        </header>

        {/* Contenido */}
        <div className="mt-16 p-4">
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/productos" element={<Productos />} />
            <Route path="/ventas" element={<Ventas />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/categorias" element={<Categorias />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
