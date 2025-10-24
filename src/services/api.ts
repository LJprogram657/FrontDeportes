interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  first_name?: string;
  last_name?: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  access?: string;
  refresh?: string;
  user?: User;
  errors?: any;
}

class ApiService {
  private baseURL = (() => {
    const origin = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
    return `${origin}/api`;
  })();
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Cargar tokens del localStorage al inicializar
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token');
      this.refreshToken = localStorage.getItem('refresh_token');
    }
  }

  // Configurar headers con autenticación
  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  // Manejar respuestas y errores
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        success: false,
        message: 'Error de conexión'
      }));
      throw new Error(errorData.message || 'Error en la petición');
    }

    return response.json();
  }

  // Renovar token de acceso
  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh/`, {
        method: 'POST',
        headers: this.getHeaders(false),
        body: JSON.stringify({ refresh: this.refreshToken }),
        credentials: 'include'  // Añadir esta línea
      });

      if (response.ok) {
        const data = await response.json();
        if (data.access) {
          this.accessToken = data.access;
          localStorage.setItem('access_token', data.access);
          return true;
        }
      }
      
      // Si llegamos aquí, el refresh token no es válido o ha expirado
      // Limpiar tokens y redirigir a login
      this.logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error renovando token:', error);
      // También limpiar tokens en caso de error
      this.logout();
    }

    return false;
  }

  // Realizar petición con retry automático
  private async makeRequest<T>(
    url: string,
    options: RequestInit,
    includeAuth: boolean = true
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        ...options,
        headers: this.getHeaders(includeAuth),
        credentials: 'include'  // Añadir esta línea para incluir cookies en solicitudes cross-origin
      });

      // Si es 401 y tenemos refresh token, intentar renovar
      if (response.status === 401 && includeAuth && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Reintentar con nuevo token
          const retryResponse = await fetch(`${this.baseURL}${url}`, {
            ...options,
            headers: this.getHeaders(true),
            credentials: 'include'  // Añadir también aquí
          });
          return this.handleResponse<T>(retryResponse);
        }
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('Error en petición API:', error);
      throw error;
    }
  }

  // Métodos de autenticación
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest<AuthResponse>('/auth/login/', {
        method: 'POST',
        body: JSON.stringify(data)
      }, false);

      if (response.success && response.access && response.refresh) {
        this.accessToken = response.access;
        this.refreshToken = response.refresh;
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error de login'
      };
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest<AuthResponse>('/auth/register/', {
        method: 'POST',
        body: JSON.stringify(data)
      }, false);

      if (response.success && response.access && response.refresh) {
        this.accessToken = response.access;
        this.refreshToken = response.refresh;
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error de registro'
      };
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.refreshToken) {
        await this.makeRequest('/auth/logout/', {
          method: 'POST',
          body: JSON.stringify({ refresh: this.refreshToken })
        });
      }
    } catch (error) {
      // No mostrar error si el backend no está disponible
      console.warn('Backend no disponible para logout, limpiando tokens localmente:', error);
    } finally {
      // Limpiar tokens independientemente del resultado
      this.accessToken = null;
      this.refreshToken = null;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  }

  async getProfile(): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      return await this.makeRequest<{ success: boolean; user: User }>('/auth/profile/', {
        method: 'GET'
      });
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error obteniendo perfil'
      };
    }
  }

  async updateProfile(data: Partial<User>): Promise<AuthResponse> {
    try {
      return await this.makeRequest<AuthResponse>('/auth/profile/update/', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error actualizando perfil'
      };
    }
  }

  async verifyToken(): Promise<boolean> {
    try {
      const response = await this.makeRequest<{ success: boolean }>('/auth/verify/', {
        method: 'GET'
      });
      return response.success;
    } catch (error) {
      return false;
    }
  }

  // Métodos de utilidad
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getCurrentUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }
}

// Instancia singleton del servicio API
export const apiService = new ApiService();
export default apiService;