# 📊 Sistema de Diagnóstico Financiero - Fluxi Finance

Sistema multiempresa (multi-tenant) para diagnóstico financiero empresarial con análisis avanzado de indicadores y métricas.

## 🏗️ Arquitectura

### Stack Tecnológico

- **Frontend**: Next.js 16 + React 19 + TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Estado**: Zustand + TanStack Query (React Query)
- **Validación**: Zod + React Hook Form
- **UI**: Tailwind CSS v4 + Lucide Icons
- **Gráficos**: Recharts
- **Testing**: Vitest + Playwright

### Principios de Diseño

✅ **Clean Architecture** - Separación de responsabilidades
✅ **Multi-tenant** - Aislamiento completo por organización
✅ **Type-Safe** - TypeScript end-to-end con validación Zod
✅ **Real-time** - Actualizaciones en tiempo real con Supabase
✅ **Row Level Security** - Seguridad a nivel de fila (RLS)
✅ **Audit Logging** - Registro completo de auditoría

## 📁 Estructura del Proyecto

```
diagnostico-financiero/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Layout raíz con providers
│   │   ├── page.tsx           # Página principal
│   │   └── globals.css        # Estilos globales
│   │
│   ├── types/                 # Definiciones de tipos
│   │   ├── models.ts          # Modelos de dominio
│   │   ├── dtos.ts            # DTOs con validación Zod
│   │   ├── database.types.ts  # Tipos generados de Supabase
│   │   └── index.ts           # Re-exports
│   │
│   ├── services/              # Capa de servicios (lógica de negocio)
│   │   ├── balance-sheet.service.ts
│   │   ├── organization.service.ts
│   │   └── financial-indicators.service.ts
│   │
│   ├── lib/
│   │   ├── supabase/          # Clientes Supabase
│   │   │   ├── client.ts      # Cliente browser
│   │   │   └── server.ts      # Cliente servidor
│   │   │
│   │   ├── hooks/             # React Hooks personalizados
│   │   │   ├── useSupabase.ts
│   │   │   ├── useOrganization.ts
│   │   │   ├── useBalanceSheet.ts
│   │   │   ├── useOrganizations.ts
│   │   │   └── useFinancialIndicators.ts
│   │   │
│   │   ├── mappers/           # Mappers DB <-> Domain
│   │   │   └── balance-sheet.mapper.ts
│   │   │
│   │   ├── providers/         # React Context Providers
│   │   │   ├── QueryProvider.tsx
│   │   │   └── ToastProvider.tsx
│   │   │
│   │   └── errors.ts          # Clases de errores personalizadas
│   │
│   └── middleware.ts          # Middleware de autenticación
│
├── supabase/
│   └── migrations/            # Migraciones SQL
│       ├── 20250101000001_initial_schema.sql
│       ├── 20250101000002_functions_and_views.sql
│       └── 20250101000003_rls_policies.sql
│
├── package.json
├── tsconfig.json
├── next.config.ts
└── tailwind.config.js
```

## 🗄️ Modelo de Datos

### Entidades Principales

#### 1. **Organizations** (Organizaciones)
- Empresas/clientes del sistema
- Plan de suscripción (free, pro, enterprise)
- Configuraciones personalizadas

#### 2. **Organization Members** (Miembros)
- Roles: owner, admin, analyst, viewer
- Permisos granulares por rol
- Estado: active, inactive, pending

#### 3. **Balance Sheets** (Balance General)
- Estados de situación financiera
- Períodos fiscales
- Estados: draft, final, archived

#### 4. **Balance Sheet Items** (Cuentas del Balance)
- Categorías: activo, pasivo, patrimonio
- Subcategorías personalizables
- Códigos contables

#### 5. **Income Statements** (Estado de Resultados)
- P&L (Profit & Loss)
- Categorías: ingresos, costos, gastos

#### 6. **Financial Indicators** (Indicadores Financieros)
- **Liquidez**: Capital de trabajo, razón corriente, prueba ácida
- **Rentabilidad**: Márgenes (bruto, operativo, neto), ROE, ROA
- **Endeudamiento**: Ratio de deuda, deuda/patrimonio
- **Eficiencia**: Rotación de activos, inventarios, cuentas por cobrar/pagar
- **Análisis**: Health Score (0-100), nivel de riesgo

#### 7. **Audit Logs** (Auditoría)
- Registro completo de cambios
- Usuario, acción, entidad, datos anteriores/nuevos

## 🔐 Seguridad (Row Level Security)

### Políticas RLS Implementadas

**Organizations:**
- `SELECT`: Ver solo organizaciones donde el usuario es miembro
- `INSERT`: Usuarios autenticados pueden crear
- `UPDATE`: Solo owners y admins
- `DELETE`: Solo owners

**Balance Sheets:**
- `SELECT`: Ver balances de organizaciones accesibles
- `INSERT`: Analysts, admins, owners
- `UPDATE`: Solo drafts para analysts, cualquier estado para admins
- `DELETE`: Solo admins y owners

**Financial Indicators:**
- `SELECT`: Todos los miembros activos
- `INSERT`: Analysts, admins, owners
- `DELETE`: Solo admins

## 🚀 Inicio Rápido

### 1. Instalación

```bash
npm install
```

### 2. Configuración de Entorno

Crear `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Ejecutar Migraciones en Supabase

Ejecutar manualmente los archivos SQL en orden:
1. `supabase/migrations/20250101000001_initial_schema.sql`
2. `supabase/migrations/20250101000002_functions_and_views.sql`
3. `supabase/migrations/20250101000003_rls_policies.sql`

### 4. Desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

### 5. Build para Producción

```bash
npm run build
npm start
```

## 📊 Indicadores Calculados

El sistema calcula automáticamente:

**Liquidez:**
- Capital de Trabajo = Activo Corriente - Pasivo Corriente
- Razón Corriente = Activo Corriente / Pasivo Corriente
- Prueba Ácida = (Activo Corriente - Inventario) / Pasivo Corriente

**Rentabilidad:**
- Margen Bruto = (Ingresos - Costos) / Ingresos
- Margen Operativo = (Ingresos - Costos - Gastos Op) / Ingresos
- Margen Neto = Utilidad Neta / Ingresos
- ROE = Utilidad Neta / Patrimonio
- ROA = Utilidad Neta / Activos Totales

**Endeudamiento:**
- Ratio de Deuda = Pasivo Total / Activo Total
- Deuda/Patrimonio = Pasivo Total / Patrimonio
- Apalancamiento Financiero = Activo Total / Patrimonio

**Eficiencia:**
- Rotación de Activos = Ingresos / Activo Total

## 📄 Licencia

Propietario - Fluxi Finance © 2025
