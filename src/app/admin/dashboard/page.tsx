'use client';

import React from 'react';

const AdminDashboardPage: React.FC = () => {
  return (
    <div>
      <div className="content-header">
        <h2 className="content-title">Dashboard Principal</h2>
        <p className="content-subtitle">Bienvenido al sistema de administración</p>
      </div>
      
      <div className="welcome-card">
        <h2>🏆 Sistema de Gestión Deportiva</h2>
        <p>
          Selecciona un módulo de la barra lateral para comenzar a gestionar el contenido del sitio. 
          Desde aquí podrás crear torneos, actualizar información, gestionar registros y programar partidos.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboardPage;