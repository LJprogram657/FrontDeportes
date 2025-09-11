# Integración con el Backend

## Configuración de la API

La comunicación con el backend se gestiona principalmente a través del servicio API ubicado en /src/services/api.ts. Este servicio proporciona métodos para realizar solicitudes HTTP al backend y manejar la autenticación.

### Configuración Base

`	ypescript
// /src/services/api.ts
export class ApiService {
  private baseURL: string;
  
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }
  
  // Métodos para obtener/establecer tokens de autenticación
  // Métodos para realizar solicitudes HTTP
}
`

## Autenticación

El sistema utiliza autenticación basada en tokens JWT:

1. El usuario inicia sesión con credenciales (email/contraseña)
2. El backend valida las credenciales y devuelve un token JWT
3. El frontend almacena el token en localStorage
4. Las solicitudes posteriores incluyen el token en el encabezado Authorization

### Flujo de Autenticación

`	ypescript
// Ejemplo de inicio de sesión
async login(email: string, password: string): Promise<User> {
  try {
    const response = await fetch(${this.baseURL}/api/auth/login/, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) throw new Error('Credenciales inválidas');
    
    const data = await response.json();
    this.setToken(data.token);
    return data.user;
  } catch (error) {
    throw error;
  }
}
`

## Servicios Específicos

Además del servicio API base, la aplicación utiliza servicios específicos para diferentes entidades:

### UserService

**Ubicación**: /src/services/userService.ts

**Funcionalidades**:
- Registro de usuarios
- Inicio de sesión
- Actualización de perfil
- Recuperación de contraseña

### TournamentService

**Ubicación**: /src/services/tournamentService.ts

**Funcionalidades**:
- Obtener lista de torneos
- Crear nuevo torneo
- Actualizar torneo existente
- Eliminar torneo
- Gestionar equipos en torneos

## Manejo de Errores

La aplicación implementa un sistema centralizado para manejar errores de API:

`	ypescript
// Ejemplo de manejo de errores
async fetchData(endpoint: string): Promise<any> {
  try {
    const response = await fetch(${this.baseURL}, {
      headers: this.getAuthHeaders()
    });
    
    if (response.status === 401) {
      // Token expirado o inválido
      this.clearToken();
      // Redirigir a página de login
      window.location.href = '/login';
      throw new Error('Sesión expirada');
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error en la solicitud');
    }
    
    return await response.json();
  } catch (error) {
    // Registrar error y/o mostrarlo al usuario
    throw error;
  }
}
`

## Optimizaciones

### Caché y SWR

La aplicación utiliza SWR (stale-while-revalidate) para gestionar el estado y la caché de las solicitudes API:

`	ypescript
import useSWR from 'swr';

// Ejemplo de uso de SWR
function useUser(id) {
  const { data, error } = useSWR(/api/users/, fetcher);

  return {
    user: data,
    isLoading: !error && !data,
    isError: error
  };
}
`

### Interceptores

Se utilizan interceptores para manejar automáticamente aspectos comunes de las solicitudes:

- Añadir tokens de autenticación
- Manejar errores comunes (401, 403, 500)
- Registrar solicitudes para depuración

## Endpoints Principales

| Endpoint | Método | Descripción | Autenticación Requerida |
|----------|--------|-------------|------------------------|
| /api/auth/login/ | POST | Iniciar sesión | No |
| /api/auth/register/ | POST | Registrar nuevo usuario | No |
| /api/auth/refresh/ | POST | Refrescar token | Sí |
| /api/users/me/ | GET | Obtener perfil del usuario actual | Sí |
| /api/tournaments/ | GET | Listar torneos | No |
| /api/tournaments/ | POST | Crear nuevo torneo | Sí |
| /api/tournaments/{id}/ | GET | Obtener detalles de un torneo | No |
| /api/tournaments/{id}/ | PUT | Actualizar torneo | Sí |
| /api/tournaments/{id}/teams/ | GET | Listar equipos de un torneo | No |
