# Guía de Instalación y Configuración

## Requisitos Previos
- Node.js 18.17 o superior
- npm o yarn
- Git

## Pasos de Instalación

### 1. Clonar el Repositorio
`ash
git clone <URL_DEL_REPOSITORIO>
cd FrontDeportes
`

### 2. Instalar Dependencias
`ash
npm install
# o usando yarn
yarn install
`

### 3. Configurar Variables de Entorno
Crea un archivo .env.local en la raíz del proyecto con las siguientes variables:

## Directorios Principales

### /src/app
Contiene las rutas y páginas de la aplicación utilizando el App Router de Next.js 14. Cada carpeta representa una ruta y contiene archivos como page.tsx, layout.tsx, loading.tsx, etc.

### /src/components
Componentes reutilizables organizados por funcionalidad o características:
- /common: Componentes básicos como botones, inputs, etc.
- /layout: Componentes de diseño como Header, Footer, Sidebar, etc.
- /forms: Componentes relacionados con formularios
- /ui: Componentes de interfaz de usuario específicos

### /src/contexts
Contextos de React para gestionar el estado global:
- AuthContext.tsx: Gestión de autenticación y usuario
- Otros contextos para funcionalidades específicas

### /src/services
Servicios para interactuar con APIs y manejar lógica de negocio:
- pi.ts: Cliente base para comunicación con el backend
- Servicios específicos para diferentes entidades (usuarios, torneos, etc.)

### /src/data
Datos estáticos, constantes y tipos:
- Enumeraciones
- Interfaces y tipos de TypeScript
- Datos de configuración

## Convenciones de Nomenclatura

- **Componentes**: PascalCase (ej. UserProfile.tsx)
- **Contextos**: PascalCase + Context (ej. AuthContext.tsx)
- **Servicios**: camelCase (ej. userService.ts)
- **Utilidades**: camelCase (ej. dateUtils.ts)
- **Páginas**: page.tsx dentro de carpetas con nombres descriptivos
