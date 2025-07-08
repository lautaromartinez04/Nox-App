import React from "react";
import { NavLink } from "react-router-dom";
import LogoBlanco from "../../media/images/login/LogoBlanco.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faBox,
  faCashRegister,
  faUser,
  faTags,
  faReceipt,
} from "@fortawesome/free-solid-svg-icons";

export const Navbar = () => {
  return (
    <aside className="group flex flex-col bg-[#5170FF] text-white w-16 hover:w-48 transition-all duration-300 fixed top-0 left-0 h-screen z-40 shadow-lg">
      {/* Logo cuadrado */}
      <div className="flex items-center justify-center h-16 border-b border-[#3f5be0]">
        <img src={LogoBlanco} alt="Logo Nox" className="w-7 h-7" />
      </div>

      <nav className="flex flex-col gap-2 p-2 text-sm font-medium text-lexend-medium">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-3 p-2 rounded transition-all duration-200 ${isActive ? "bg-[#3f5be0]" : "hover:bg-[#3f5be0]"
            }`
          }
        >
          <span className="w-6 h-6 min-w-[2rem] flex items-center justify-center">
            <FontAwesomeIcon icon={faHome} />
          </span>
          <span className="whitespace-nowrap opacity-0 translate-x-[-8px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-in-out">
            Inicio
          </span>
        </NavLink>

        <NavLink
          to="/productos"
          className={({ isActive }) =>
            `flex items-center gap-3 p-2 rounded transition-all duration-200 ${isActive ? "bg-[#3f5be0]" : "hover:bg-[#3f5be0]"
            }`
          }
        >
          {/* Icono centrado */}
          <span className="w-6 h-6 min-w-[2rem] flex items-center justify-center">
            <FontAwesomeIcon icon={faBox} />
          </span>

          {/* Texto que aparece suavemente al hacer hover */}
          <span className="whitespace-nowrap overflow-hidden opacity-0 translate-x-[-8px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-in-out">
            Productos
          </span>
        </NavLink>

        <NavLink
          to="/ventas"
          className={({ isActive }) =>
            `flex items-center gap-3 p-2 rounded transition-all duration-200 ${isActive ? "bg-[#3f5be0]" : "hover:bg-[#3f5be0]"
            }`
          }
        >
          <span className="w-6 h-6 min-w-[2rem] flex items-center justify-center">
            <FontAwesomeIcon icon={faCashRegister} />
          </span>
          <span className="whitespace-nowrap opacity-0 translate-x-[-8px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-in-out">
            Ventas
          </span>
        </NavLink>

        <NavLink
          to="/clientes"
          className={({ isActive }) =>
            `flex items-center gap-3 p-2 rounded transition-all duration-200 ${isActive ? "bg-[#3f5be0]" : "hover:bg-[#3f5be0]"
            }`
          }
        >
          <span className="w-6 h-6 min-w-[2rem] flex items-center justify-center">
            <FontAwesomeIcon icon={faUser} />
          </span>
          <span className="whitespace-nowrap opacity-0 translate-x-[-8px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-in-out">
            Clientes
          </span>
        </NavLink>

        <NavLink
          to="/categorias"
          className={({ isActive }) =>
            `flex items-center gap-3 p-2 rounded transition-all duration-200 ${isActive ? "bg-[#3f5be0]" : "hover:bg-[#3f5be0]"
            }`
          }
        >
          <span className="w-6 h-6 min-w-[2rem] flex items-center justify-center">
            <FontAwesomeIcon icon={faTags} />
          </span>
          <span className="whitespace-nowrap opacity-0 translate-x-[-8px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-in-out">
            Categorías
          </span>
        </NavLink>

        <NavLink
          to="/devoluciones"
          className={({ isActive }) =>
            `flex items-center gap-3 p-2 rounded transition-all duration-200 ${isActive ? "bg-[#3f5be0]" : "hover:bg-[#3f5be0]"
            }`
          }
        >
          <span className="w-6 h-6 min-w-[2rem] flex items-center justify-center">
            <FontAwesomeIcon icon={faReceipt} />
          </span>
          <span className="whitespace-nowrap opacity-0 translate-x-[-8px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-in-out">
            Devoluciones
          </span>
        </NavLink>
      </nav>
    </aside >
  );
};
