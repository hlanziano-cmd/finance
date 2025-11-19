# 🏗️ Documentación de Arquitectura - Sistema de Diagnóstico Financiero

## 📋 Resumen Ejecutivo

Este documento describe la arquitectura completa del sistema de diagnóstico financiero multiempresa implementado para Fluxi Finance. El sistema está diseñado siguiendo principios de Clean Architecture, con separación clara de responsabilidades y seguridad robusta a nivel de base de datos.

---

## 🎯 Objetivos de la Arquitectura

1. **Multi-tenancy**: Aislamiento completo de datos por organización
2. **Seguridad**: Row Level Security (RLS) en todas las tablas
3. **Escalabilidad**: Diseño horizontal escalable
4. **Type Safety**: TypeScript end-to-end con validación runtime
5. **Mantenibilidad**: Código modular y bien organizado
6. **Auditoría**: Trazabilidad completa de cambios

---

## 🗂️ Estructura de Capas

### Capa 1: Presentación (Frontend)
**Ubicación**: `src/app/`

- **Responsabilidad**: UI/UX, routing, SSR
- **Tecnologías**: Next.js 16 App Router, React 19, Tailwind CSS
- **Características**:
  - Server Components por defecto
  - Client Components solo cuando necesario
  - Metadata SEO optimizada
  - Layouts reutilizables

### Capa 2: Hooks & State Management
**Ubicación**: `src/lib/hooks/`

- **React Query (TanStack Query)**:
  - Cache inteligente
  - Optimistic updates
  - Invalidación automática
  - Retry logic

- **Zustand**:
  - Estado global ligero
  - Organización actual
  - Configuración de usuario

### Capa 3: Servicios (Business Logic)
**Ubicación**: `src/services/`

**Características:**
- Encapsulación de lógica de negocio
- Validación de DTOs con Zod
- Manejo centralizado de errores
- Transacciones y operaciones complejas

**Servicios Implementados:**

#### BalanceSheetService
```typescript
- CRUD completo de balances
- Gestión de ítems/cuentas
- Cálculo de totales
- Finalización de balances
- Duplicación de balances
- Audit logging automático
```

#### OrganizationService
```typescript
- CRUD de organizaciones
- Gestión de miembros
- Control de roles y permisos
- Validación de acceso
```

#### FinancialIndicatorsService
```typescript
- Cálculo de indicadores
- Comparación entre períodos
- Resumen de organización
- Análisis de tendencias
```

### Capa 4: Mappers
**Ubicación**: `src/lib/mappers/`

**Responsabilidad**: Transformación entre modelos

```
Database Model ⟷ Domain Model
```

**Ventajas**:
- Desacoplamiento total
- Facilita cambios en DB sin afectar dominio
- Validaciones centralizadas

### Capa 5: Tipos & Validación
**Ubicación**: `src/types/`

#### models.ts
Modelos de dominio (representación interna):
- `Organization`
- `BalanceSheet`
- `BalanceSheetItem`
- `FinancialIndicators`
- etc.

#### dtos.ts
Data Transfer Objects con validación Zod:
- `CreateBalanceSheetDTO`
- `UpdateBalanceSheetDTO`
- `CreateOrganizationDTO`
- etc.

#### database.types.ts
Tipos generados automáticamente de Supabase:
- Tablas (Row, Insert, Update)
- Vistas
- Funciones
- Enums

### Capa 6: Base de Datos
**Ubicación**: `supabase/migrations/`

#### Estructura de Tablas

**Core Tables:**
1. `organizations` - Empresas/clientes
2. `organization_members` - Membresías con roles
3. `balance_sheets` - Estados financieros
4. `balance_sheet_items` - Cuentas del balance
5. `income_statements` - Estados de resultados
6. `income_statement_items` - Cuentas de P&L
7. `financial_indicators` - Indicadores calculados
8. `audit_logs` - Registro de auditoría
9. `user_profiles` - Perfiles extendidos

**Views:**
- `v_organization_financial_summary` - Resumen por organización
- `v_user_organizations` - Organizaciones accesibles por usuario

**Functions:**
- `calculate_balance_totals()` - Totales del balance
- `calculate_income_totals()` - Totales del P&L
- `calculate_financial_indicators()` - Todos los indicadores
- `get_user_organizations()` - RLS helper
- `has_organization_permission()` - RLS helper

---

## 🔐 Modelo de Seguridad

### Row Level Security (RLS)

#### Jerarquía de Roles

```
owner (nivel 4)
  └─ Todos los permisos
     └─ Puede eliminar organización

admin (nivel 3)
  └─ Gestión completa excepto eliminar org
     └─ Agregar/remover miembros

analyst (nivel 2)
  └─ Crear y editar documentos draft
     └─ Calcular indicadores

viewer (nivel 1)
  └─ Solo lectura
```

#### Políticas Principales

**Patrón General:**
```sql
-- SELECT: Ver datos de organizaciones accesibles
USING (organization_id IN (SELECT get_user_organizations(auth.uid())))

-- INSERT: Verificar rol requerido
WITH CHECK (has_organization_permission(auth.uid(), organization_id, 'analyst'))

-- UPDATE: Rol + condiciones adicionales
USING (has_organization_permission(...) AND status = 'draft')

-- DELETE: Solo roles superiores
USING (has_organization_permission(auth.uid(), organization_id, 'admin'))
```

### Triggers de Seguridad

1. **Auto-crear perfil de usuario**
   - Trigger: `on_auth_user_created`
   - Acción: Crea `user_profiles` automáticamente

2. **Auto-agregar owner**
   - Trigger: `on_organization_created`
   - Acción: Agrega creador como owner automáticamente

3. **Updated_at automático**
   - Múltiples triggers
   - Acción: Actualiza `updated_at` en modificaciones

---

## 📊 Flujo de Datos

### Ejemplo: Crear Balance General

```mermaid
Usuario → useCreateBalanceSheet() hook
  ↓
BalanceSheetService.create()
  ↓
Validación Zod (createBalanceSheetSchema)
  ↓
Supabase Client (RLS verificado)
  ↓
Database INSERT
  ├─ balance_sheets table
  └─ audit_logs table (trigger)
  ↓
Mapper (mapBalanceSheetFromDB)
  ↓
React Query Cache Update
  ↓
UI Actualizada + Toast
```

### Ejemplo: Calcular Indicadores

```mermaid
Usuario → useCalculateIndicators() hook
  ↓
FinancialIndicatorsService.calculate()
  ↓
Supabase RPC: calculate_financial_indicators()
  ├─ Obtiene datos del balance
  ├─ Obtiene datos del P&L
  ├─ Calcula 20+ indicadores
  ├─ Calcula health score
  └─ Determina risk level
  ↓
INSERT en financial_indicators
  ↓
Retorna ID del registro
  ↓
FinancialIndicatorsService.getById()
  ↓
Mapper → Domain Model
  ↓
Cache Update + Invalidación
  ↓
Dashboard actualizado
```

---

## 🎨 Patrones de Diseño Implementados

### 1. Repository Pattern
**Ubicación**: Services

Encapsula toda la lógica de acceso a datos:
```typescript
class BalanceSheetService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getById(id: string): Promise<BalanceSheet> {
    // Implementación
  }
}
```

### 2. Mapper Pattern
**Ubicación**: lib/mappers

Separa modelos de DB y dominio:
```typescript
function mapBalanceSheetFromDB(data: BalanceSheetDB): BalanceSheet {
  return {
    id: data.id,
    organizationId: data.organization_id,
    // ...transformaciones
  };
}
```

### 3. DTO Pattern
**Ubicación**: types/dtos.ts

Validación de entrada:
```typescript
const createBalanceSheetSchema = z.object({
  name: z.string().min(3),
  // ...validaciones
}).refine(/* reglas personalizadas */);
```

### 4. Error Handling Pattern
**Ubicación**: lib/errors.ts

Jerarquía de errores:
```typescript
AppError
  ├── ValidationError (400)
  ├── UnauthorizedError (401)
  ├── ForbiddenError (403)
  ├── NotFoundError (404)
  └── DatabaseError (500)
```

### 5. Optimistic Updates
**Ubicación**: Hooks

React Query con rollback:
```typescript
useMutation({
  onMutate: async (dto) => {
    // Cancelar queries
    await queryClient.cancelQueries({ queryKey: ['balance-sheet', id] });

    // Guardar snapshot
    const previousData = queryClient.getQueryData(['balance-sheet', id]);

    // Update optimista
    queryClient.setQueryData(['balance-sheet', id], (old) => ({
      ...old,
      ...dto,
    }));

    return { previousData };
  },
  onError: (error, variables, context) => {
    // Rollback
    if (context?.previousData) {
      queryClient.setQueryData(['balance-sheet', id], context.previousData);
    }
  },
});
```

---

## 🚀 Performance & Optimización

### Estrategias Implementadas

1. **React Query Caching**
   - Stale time: 1-5 minutos según entidad
   - Cache persistente en memoria
   - Revalidación inteligente

2. **Server Components**
   - Renderizado en servidor por defecto
   - Reducción de JavaScript enviado al cliente
   - Mejor SEO y performance inicial

3. **Code Splitting**
   - Lazy loading de componentes pesados
   - Dynamic imports donde sea posible

4. **Database Indexes**
   - Índices en todas las FKs
   - Índices compuestos para queries comunes
   - Índices en campos de filtrado frecuente

5. **Database Functions**
   - Cálculos complejos en PostgreSQL
   - Reducción de round-trips
   - Aprovechamiento de optimizador de PG

---

## 🧪 Testing Strategy

### Tipos de Tests

1. **Unit Tests** (Vitest)
   - Servicios
   - Mappers
   - Utilidades
   - Hooks personalizados

2. **Integration Tests** (Vitest + Mock Supabase)
   - Flujos completos de servicios
   - Validaciones de DTOs
   - Error handling

3. **E2E Tests** (Playwright)
   - Flujos de usuario completos
   - Casos de uso críticos
   - Tests multi-browser

---

## 📈 Escalabilidad

### Horizontal Scaling

**Frontend:**
- Stateless por diseño
- Deploy en múltiples regiones (Vercel Edge)
- CDN para assets estáticos

**Backend (Supabase):**
- Read replicas para queries
- Connection pooling
- Load balancing automático

### Vertical Scaling

**Database:**
- Upgradeable a instancias más potentes
- Particionamiento por organización (futuro)
- Archivado de datos históricos

---

## 🔄 Ciclo de Vida de Datos

### Estados de Documentos

```
draft → final → archived
  ↓      ↓        ↓
editable | readonly | readonly
analysts | all     | all
```

### Audit Trail

Todos los cambios se registran:
```typescript
{
  user_id: UUID,
  action: 'create' | 'update' | 'delete' | 'finalize',
  entity_type: 'balance_sheet' | 'organization' | ...,
  entity_id: UUID,
  old_data: JSONB,
  new_data: JSONB,
  ip_address: INET,
  timestamp: TIMESTAMPTZ
}
```

---

## 🛠️ Próximos Pasos

### Fase 2: UI Components
- [ ] Dashboard principal
- [ ] Formularios de balance
- [ ] Visualizaciones (Recharts)
- [ ] Tablas interactivas
- [ ] Modales y dialogs

### Fase 3: Features Avanzados
- [ ] Exportación PDF/Excel
- [ ] Comparación multi-período
- [ ] Benchmarking sectorial
- [ ] Proyecciones con ML
- [ ] Alertas automáticas

### Fase 4: Integraciones
- [ ] API REST pública
- [ ] Webhooks
- [ ] Integración con ERPs
- [ ] Importación masiva de datos

---

## 📚 Recursos y Referencias

- [Next.js 16 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Zod Validation](https://zod.dev/)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

**Documento creado**: Enero 2025
**Última actualización**: Enero 2025
**Autor**: Equipo Fluxi Finance
