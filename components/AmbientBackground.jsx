"use client";
import React, { useEffect } from "react";
import { useSocketStats } from "./SocketContext";


export default function AmbientBackground() {
  const { socketStats } = useSocketStats();
  const color = socketStats?.color || "#a855f7";

  // Efecto que calcula las transparencias y colores oscuros y los inyecta al root global
  useEffect(() => {
    const hex = color.replace("#", "");
    let r = 0, g = 0, b = 0;
    
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }

    const darkR = Math.floor(r * 0.6);
    const darkG = Math.floor(g * 0.6);
    const darkB = Math.floor(b * 0.6);

    const root = document.documentElement;
    root.style.setProperty("--dynamic-color", color);
    root.style.setProperty("--dynamic-color-15", `rgba(${r}, ${g}, ${b}, 0.15)`);
    root.style.setProperty("--dynamic-color-30", `rgba(${r}, ${g}, ${b}, 0.3)`);
    root.style.setProperty("--dynamic-color-40", `rgba(${r}, ${g}, ${b}, 0.4)`);
    root.style.setProperty("--dynamic-color-50", `rgba(${r}, ${g}, ${b}, 0.5)`);
    root.style.setProperty("--dynamic-color-dark", `rgb(${darkR}, ${darkG}, ${darkB})`);
  }, [color]);


  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#050508]">
      <style dangerouslySetInnerHTML={{__html: `
        .bg-stars {
          background-image: 
            radial-gradient(1px 1px at 15px 25px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 75px 65px, rgba(255,255,255,0.9), rgba(0,0,0,0)),
            radial-gradient(1px 1px at 145px 115px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 215px 35px, rgba(255,255,255,0.7), rgba(0,0,0,0)),
            radial-gradient(1px 1px at 275px 175px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 335px 85px, rgba(255,255,255,0.5), rgba(0,0,0,0)),
            radial-gradient(2px 2px at 400px 220px, rgba(255,255,255,0.8), rgba(0,0,0,0));
          background-repeat: repeat;
          background-size: 450px 450px;
        }
      `}} />

      {/* Capa de Estrellas Estáticas (0 lag) */}
      <div className="absolute inset-0 bg-stars opacity-40 mix-blend-screen"></div>

      {/* Gradientes Radiales Nativos: Se ven como auroras pero el consumo de GPU es nulo */}
      <div
        className="absolute inset-0 opacity-60 transition-colors duration-1000 ease-in-out"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 20%, var(--dynamic-color-30), transparent 45%),
            radial-gradient(circle at 85% 30%, var(--dynamic-color-15), transparent 50%),
            radial-gradient(circle at 50% 80%, var(--dynamic-color-30), transparent 60%)
          `
        }}
      ></div>
      
      {/* Viñeta para legibilidad */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050508]/60 to-[#050508]"></div>
    </div>
  );
}