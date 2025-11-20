# Reestructuración de Fluxi Finance - Diagnóstico Financiero

## 📋 Resumen de Cambios

Se ha reestructurado la aplicación según los siguientes requerimientos:

1. ✅ **Eliminación del Dashboard Principal**: La página principal ahora redirige automáticamente a Balance General
2. ✅ **Nuevo Formulario de Balance**: Permite crear balances con cuentas del PUC colombiano
3. ✅ **Tooltips Educativos**: Cada cuenta tiene una explicación clara y ejemplos prácticos
4. ✅ **Validación de Ecuación Contable**: Verifica que Activo = Pasivo + Patrimonio
5. ✅ **Script de Limpieza**: Para eliminar datos de prueba y comenzar desde cero

---

## 🗂️ Estructura de Archivos Creados/Modificados

### Nuevos Archivos

#### 1. **Plan Único de Cuentas (PUC) Colombia**
📄 `src/lib/constants/chart-of-accounts.ts`

Contiene la estructura completa de cuentas contables colombianas:

**ACTIVO (Todo lo que la empresa posee)**
- **Activo Corriente**: Caja, Bancos, Clientes, Mercancías, Anticipos de impuestos
- **Activo No Corriente**: Construcciones, Maquinaria, Equipos de oficina, Equipos de cómputo, Vehículos

**PASIVO (Todo lo que la empresa debe)**
- **Pasivo Corriente**: Proveedores, Costos por pagar, Retención en la fuente, IVA, Salarios, Cesantías
- **Pasivo No Corriente**: Préstamos bancarios, Obligaciones laborales largo plazo

**PATRIMONIO (Recursos propios)**
- Capital social
- Reservas obligatorias
- Utilidades acumuladas
- Utilidad del ejercicio

**Funciones incluidas**:
```typescript
// Validar ecuación contable
validateAccountingEquation(activo, pasivo, patrimonio)

// Buscar cuenta por código
getAccountByCode(code)

// Obtener cuentas por categoría
getAccountsByCategory('activo' | 'pasivo' | 'patrimonio')
```

#### 2. **Componente Tooltip**
📄 `src/components/ui/Tooltip.tsx`

Muestra explicaciones educativas al pasar el mouse sobre las cuentas:
- Descripción clara de cada cuenta
- Ejemplos prácticos colombianos
- Posicionamiento inteligente (top/bottom/left/right)

Incluye componente especializado:
```typescript
<LabelWithTooltip
  label="Nombre de la cuenta"
  tooltip="Explicación clara"
  examples={["Ejemplo 1", "Ejemplo 2"]}
  required
/>
```

#### 3. **Formulario de Nuevo Balance**
📄 `src/app/dashboard/balances/new/page.tsx`

Formulario completo para crear balances con:
- ✅ Todas las cuentas del PUC (códigos + nombres)
- ✅ Tooltips explicativos en cada cuenta
- ✅ Campos numéricos con formato de moneda ($)
- ✅ Cálculo automático de totales por sección
- ✅ Validación de ecuación contable en tiempo real
- ✅ Indicadores visuales (verde = cuadrado, rojo = descuadrado)
- ✅ Prevención de guardado si no está cuadrado

**Secciones del formulario**:
1. Información básica (nombre, fechas, año fiscal)
2. ACTIVO (con subsecciones Corriente y No Corriente)
3. PASIVO (con subsecciones Corriente y No Corriente)
4. PATRIMONIO
5. Validación de ecuación contable con alerta visual

#### 4. **Página de Lista de Balances Actualizada**
📄 `src/app/balances/page.tsx`

Versión simplificada que apunta al nuevo formulario de creación.

#### 5. **Script de Limpieza de Datos**
📄 `supabase/cleanup-test-data.sql`

Elimina todos los datos de prueba manteniendo la estructura:
```sql
-- Ejecutar en Supabase SQL Editor
-- Elimina: logs, indicadores, estados de resultado,
--          balances, membresías, organizaciones, perfiles
```

**ADVERTENCIA**: Esta acción no se puede deshacer. Úsalo con cuidado.

---

### Archivos Modificados

#### 1. **Sidebar del Dashboard**
📄 `src/components/dashboard/Sidebar.tsx`

**Cambios**:
- ❌ Removido: Opción "Dashboard"
- ✅ Mantenido: Balance General, Indicadores, Organizaciones, Equipo, Configuración
- Balance General ahora es la primera opción

**Navegación actualizada**:
```typescript
const navigation = [
  { name: 'Balance General', href: '/dashboard/balances', icon: FileText },
  { name: 'Indicadores', href: '/dashboard/indicators', icon: TrendingUp },
  { name: 'Organizaciones', href: '/dashboard/organizations', icon: Building2 },
  { name: 'Equipo', href: '/dashboard/team', icon: Users },
  { name: 'Configuración', href: '/dashboard/settings', icon: Settings },
];
```

#### 2. **Página Principal del Dashboard**
📄 `src/app/dashboard/page.tsx`

**Cambios**:
- Ahora redirige automáticamente a `/dashboard/balances`
- Muestra un loader mientras redirige
- Ya no muestra el dashboard de estadísticas

---

## 🎯 Cómo Usar la Nueva Aplicación

### Paso 1: Limpiar Datos de Prueba

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Abre el SQL Editor
3. Ejecuta el archivo `cleanup-test-data.sql`
4. Verifica que todas las tablas estén vacías

### Paso 2: Crear una Organización

1. Inicia sesión en la aplicación
2. Ve a "Organizaciones" en el menú lateral
3. Crea tu primera organización con datos reales

### Paso 3: Crear tu Primer Balance

1. Ve a "Balance General" en el menú lateral
2. Clic en "Nuevo Balance"
3. Completa la información básica:
   - Nombre del balance
   - Fecha de inicio y fin del período
   - Año fiscal

4. Ingresa los valores de cada cuenta:
   - Todas las cuentas tienen un tooltip explicativo (ícono ℹ️)
   - Pasa el mouse sobre el ícono para ver la explicación
   - Ingresa solo las cuentas que aplican a tu empresa

5. Verifica la ecuación contable:
   - Debe mostrarse en verde "El balance está cuadrado ✓"
   - Si está en rojo, revisa los valores ingresados
   - La diferencia debe ser $0.00

6. Guarda el balance

---

## 📚 Conceptos Contables Incluidos

### Ecuación Contable Fundamental

```
ACTIVO = PASIVO + PATRIMONIO
```

**Ejemplo práctico**:
```
Si tu empresa tiene:
- Activos (lo que posees): $100,000,000
- Pasivos (lo que debes): $30,000,000
- Patrimonio debe ser: $70,000,000

Para que el balance esté cuadrado:
$100,000,000 = $30,000,000 + $70,000,000 ✓
```

### Clasificación de Cuentas

#### Activo Corriente
Recursos que se convertirán en efectivo en menos de 1 año:
- Caja y bancos
- Cuentas por cobrar (clientes)
- Inventarios

#### Activo No Corriente
Recursos de largo plazo (más de 1 año):
- Inmuebles
- Maquinaria y equipo
- Vehículos

#### Pasivo Corriente
Deudas que vencen en menos de 1 año:
- Proveedores
- Impuestos por pagar
- Nómina por pagar

#### Pasivo No Corriente
Deudas a largo plazo (más de 1 año):
- Préstamos bancarios
- Leasing financiero

#### Patrimonio
Recursos propios de la empresa:
- Capital aportado por los socios
- Utilidades no distribuidas

---

## 🎨 Características Visuales

### Código de Colores

- **Azul**: Activo (lo que posees)
- **Rojo**: Pasivo (lo que debes)
- **Verde**: Patrimonio (recursos propios)

### Validación Visual

- ✅ **Verde**: Balance cuadrado, puede guardarse
- ❌ **Rojo**: Balance descuadrado, no puede guardarse
- ⚠️ **Amarillo**: Advertencia informativa

### Tooltips

Cada cuenta muestra:
1. **Descripción**: Explicación clara en español sencillo
2. **Ejemplos**: Casos prácticos colombianos
3. **Código PUC**: Código oficial del Plan Único de Cuentas

---

## 🔧 Arquitectura Técnica

### Stack Tecnológico

- **Frontend**: Next.js 16 (App Router) + React 19
- **Estado Global**: Zustand con persistencia en localStorage
- **Validación**: Zod + validación custom de ecuación contable
- **Base de Datos**: Supabase (PostgreSQL)
- **Estilos**: Tailwind CSS v4
- **Queries**: TanStack Query (React Query)

### Componentes Reutilizables

```typescript
// Tooltip con ejemplos
<Tooltip content="Explicación" examples={["Ej 1"]} />

// Label con tooltip integrado
<LabelWithTooltip
  label="Caja"
  tooltip="Dinero en efectivo"
  examples={["Efectivo en caja menor"]}
/>
```

### Validación de Ecuación Contable

```typescript
import { validateAccountingEquation } from '@/src/lib/constants/chart-of-accounts';

const validation = validateAccountingEquation(
  totalActivo,
  totalPasivo,
  totalPatrimonio
);

// validation.isValid: true/false
// validation.difference: monto de la diferencia
// validation.message: mensaje explicativo
```

---

## 📝 Próximos Pasos Recomendados

### Funcionalidades Pendientes

1. **Extender el servicio de balance** para guardar los items de cuentas
   - Actualmente solo guarda el balance básico
   - Necesita guardar cada cuenta con su monto

2. **Página de detalle de balance**
   - Ver balance completo guardado
   - Opción de editar (solo si está en estado "draft")
   - Exportar a PDF/Excel

3. **Estado de Resultados**
   - Formulario similar para ingresos y gastos
   - Cálculo automático de utilidad/pérdida
   - Vinculación con Balance General

4. **Indicadores Financieros**
   - Cálculo automático a partir de balances
   - Visualización con gráficas (Recharts)
   - Interpretación educativa

5. **Reportes y Análisis**
   - Comparación de períodos
   - Gráficas de tendencias
   - Sugerencias de mejora

---

## 🚀 Comandos Útiles

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Limpiar cache de Next.js
rm -rf .next
```

### Base de Datos

```bash
# Limpiar datos de prueba
# Ejecutar cleanup-test-data.sql en Supabase SQL Editor
```

---

## 📞 Soporte

Si tienes preguntas sobre:
- **Contabilidad**: Cada tooltip tiene explicaciones educativas
- **Uso de la app**: Revisa esta documentación
- **Problemas técnicos**: Revisa los logs del navegador (F12 → Console)

---

## 🎓 Glosario Contable

| Término | Significado |
|---------|-------------|
| **Balance General** | Fotografía financiera de la empresa en un momento específico |
| **Activo** | Todo lo que la empresa posee con valor económico |
| **Pasivo** | Todo lo que la empresa debe a terceros |
| **Patrimonio** | Recursos propios de la empresa (capital + utilidades) |
| **Corriente** | Corto plazo (menos de 1 año) |
| **No Corriente** | Largo plazo (más de 1 año) |
| **PUC** | Plan Único de Cuentas - Estándar contable colombiano |
| **Ecuación Contable** | Activo = Pasivo + Patrimonio |
| **Cuadrar el balance** | Hacer que la ecuación contable se cumpla |

---

**Última actualización**: 2025-11-20
**Versión de la app**: 1.0.0 - Reestructuración completa
