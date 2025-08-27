'use client';

import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const AdminDashboard: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
    
    if (!user?.is_admin) {
      router.push('/');
      return;
    }
  }, [isAuthenticated, user, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!isAuthenticated || !user?.is_admin) {
    return <div>Cargando...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        background: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: '0 0 10px 0', color: '#333' }}>Panel de Administrador</h1>
          <p style={{ margin: 0, color: '#666' }}>Bienvenido, {user.first_name} {user.last_name}</p>
        </div>
        <button 
          onClick={handleLogout}
          style={{
            background: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Cerrar Sesión
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#333', marginBottom: '15px' }}>👤 Información del Usuario</h3>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Nombre:</strong> {user.first_name} {user.last_name}</p>
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Admin:</strong> {user.is_admin ? '✅ Sí' : '❌ No'}</p>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#333', marginBottom: '15px' }}>🏆 Gestión de Torneos</h3>
          <p>Aquí podrás:</p>
          <ul>
            <li>Crear nuevos torneos</li>
            <li>Editar torneos existentes</li>
            <li>Gestionar equipos</li>
            <li>Ver estadísticas</li>
          </ul>
          <button style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '10px'
          }}>
            Gestionar Torneos
          </button>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#333', marginBottom: '15px' }}>👥 Gestión de Usuarios</h3>
          <p>Funciones disponibles:</p>
          <ul>
            <li>Ver lista de usuarios</li>
            <li>Crear nuevos usuarios</li>
            <li>Asignar permisos</li>
            <li>Gestionar equipos</li>
          </ul>
          <button style={{
            background: '#28a745',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '10px'
          }}>
            Gestionar Usuarios
          </button>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#333', marginBottom: '15px' }}>⚙️ Configuración</h3>
          <p>Opciones del sistema:</p>
          <ul>
            <li>Configuración general</li>
            <li>Respaldos</li>
            <li>Logs del sistema</li>
            <li>Mantenimiento</li>
          </ul>
          <button style={{
            background: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '10px'
          }}>
            Configuración
          </button>
        </div>
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button 
          onClick={() => router.push('/')}
          style={{
            background: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Volver al Inicio
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;