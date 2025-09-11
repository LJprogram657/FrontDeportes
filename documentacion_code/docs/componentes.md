# Componentes Principales

## Estructura de Componentes

Los componentes están organizados en categorías según su función y alcance:

### Componentes de Layout

#### Header
**Ubicación**: /src/components/layout/Header.tsx

**Descripción**: Barra de navegación principal que muestra el logo, enlaces de navegación y controles de usuario (inicio de sesión/registro o perfil de usuario).

**Props**:
- 	ransparent?: boolean - Determina si el fondo es transparente

**Ejemplo de uso**:
`	sx
<Header transparent={true} />
`

#### Footer
**Ubicación**: /src/components/layout/Footer.tsx

**Descripción**: Pie de página con enlaces útiles, información de contacto y derechos de autor.

#### Layout
**Ubicación**: /src/components/layout/Layout.tsx

**Descripción**: Componente contenedor que envuelve las páginas con Header y Footer.

**Props**:
- children: ReactNode - Contenido de la página
- hideHeader?: boolean - Oculta el encabezado si es true
- hideFooter?: boolean - Oculta el pie de página si es true

### Componentes de Autenticación

#### LoginForm
**Ubicación**: /src/components/auth/LoginForm.tsx

**Descripción**: Formulario de inicio de sesión que maneja la autenticación de usuarios.

**Funcionalidades**:
- Validación de campos
- Manejo de errores de autenticación
- Redirección tras inicio de sesión exitoso

#### RegisterForm
**Ubicación**: /src/components/auth/RegisterForm.tsx

**Descripción**: Formulario de registro de nuevos usuarios.

### Componentes de UI Comunes

#### Button
**Ubicación**: /src/components/ui/Button.tsx

**Descripción**: Botón personalizado con diferentes variantes y estados.

**Props**:
- ariant: 'primary' | 'secondary' | 'outline' | 'ghost'
- size: 'sm' | 'md' | 'lg'
- isLoading?: boolean
- disabled?: boolean
- onClick?: () => void
- children: ReactNode

#### Card
**Ubicación**: /src/components/ui/Card.tsx

**Descripción**: Contenedor con estilo de tarjeta para mostrar información.

**Props**:
- 	itle?: string
- children: ReactNode
- className?: string

### Componentes Específicos de la Aplicación

#### TournamentCard
**Ubicación**: /src/components/tournaments/TournamentCard.tsx

**Descripción**: Tarjeta que muestra información resumida de un torneo.

**Props**:
- 	ournament: Tournament - Datos del torneo a mostrar
- onSelect?: (id: string) => void - Función llamada al seleccionar el torneo

#### TeamList
**Ubicación**: /src/components/teams/TeamList.tsx

**Descripción**: Lista de equipos con opciones de filtrado y ordenación.

**Props**:
- 	eams: Team[] - Array de equipos a mostrar
- onTeamSelect?: (team: Team) => void - Función llamada al seleccionar un equipo

## Buenas Prácticas

1. **Componentes Puros**: Crear componentes que dependan solo de sus props y no tengan efectos secundarios.

2. **Composición**: Favorecer la composición de componentes pequeños sobre componentes grandes y complejos.

3. **Prop Drilling**: Evitar el prop drilling excesivo utilizando Context API cuando sea necesario.

4. **Memoización**: Utilizar React.memo, useMemo y useCallback para optimizar el rendimiento cuando sea necesario.

5. **Tipos**: Definir interfaces TypeScript claras para las props de los componentes.
