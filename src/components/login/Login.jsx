import React, { useState } from 'react';
import NoxLogo from '../../media/images/login/Logo.png';

export const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error('Login fallido');

      const data = await res.json();
      localStorage.setItem('token', data.token);
      setError(false);
      onLoginSuccess();
    } catch (err) {
      setError(true);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gray-100 overflow-hidden">
      {/* Marca de agua */}
      <img
        src={NoxLogo}
        alt="Nox Logo"
        className="absolute opacity-20 w-[1000px] select-none pointer-events-none"
        style={{ zIndex: 0 }}
      />

      {/* Tarjeta de login */}
      <form
        onSubmit={handleSubmit}
        className={`z-10 bg-white shadow-lg rounded-2xl p-10 w-full max-w-sm transition border-2 ${
          error ? 'border-red-500' : 'border-transparent'
        }`}
      >
        <div className="w-full flex justify-center mb-6">
          <img src={NoxLogo} alt="Logo" className="w-[100px]" />
        </div>

        <div className="mb-4">
          <label className="text-sm text-gray-600 block mb-1 text-lexend-regular">Usuario</label>
          <input
            type="text"
            placeholder="Ingresá tu usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 text-lexend-light ${
              error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#5170FF]'
            }`}
            required
          />
          {error && (
            <p className="text-xs text-red-600 mt-1">Usuario incorrecto</p>
          )}
        </div>

        <div className="mb-6">
          <label className="text-sm text-gray-600 block mb-1  text-lexend-regular">Contraseña</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 text-lexend-light ${
              error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#5170FF]'
            }`}
            required
          />
          {error && (
            <p className="text-xs text-red-600 mt-1">Contraseña incorrecta</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-[#5170FF] hover:bg-[#3f5be0] text-white rounded-md font-medium transition text-lexend-medium"
        >
          Ingresar
        </button>
      </form>
    </div>
  );
};
