# Eliminación del Módulo de Organizaciones

## 📋 Resumen de Cambios

Se ha simplificado la aplicación eliminando el concepto de organizaciones. Ahora los balances pertenecen directamente al usuario que los crea.

---

## ✅ Cambios Realizados

### 1. **Sidebar - Navegación Simplificada**
📄 `src/components/dashboard/Sidebar.tsx`

**Cambios**:
- ❌ Eliminado: Opción "Organizaciones"
- ❌ Eliminado: Opción "Equipo"
- ❌ Eliminado: Selector de organización en el sidebar
- ✅ Navegación simplificada: Balance General, Indicadores, Configuración

### 2. **Servicios - Usuario Directo**
📄 `src/services/balance-sheet.service.ts`

**Cambios**:
- Método `list()` ahora usa `created_by` (usuario) en lugar de `organization_id`
- Método `create()` ya no requiere `organizationId` como parámetro
- Balances se crean con `organization_id: null`
- Audit logs manejan `organization_id` opcional

**Antes**:
```typescript
async create(organizationId: string, dto: CreateBalanceSheetDTO)
async list(organizationId: string, filters?: BalanceSheetFilters)
```

**Después**:
```typescript
async create(dto: CreateBalanceSheetDTO)
async list(filters?: BalanceSheetFilters)
```

### 3. **Hooks - Sin Dependencia de Organización**
📄 `src/lib/hooks/useBalanceSheet.ts`

**Cambios**:
- ❌ Removido: `useOrganization` import
- ✅ `useBalanceSheets()` ya no depende de `currentOrganization`
- ✅ `useCreateBalanceSheet()` no requiere organización
- Query keys simplificados

**Antes**:
```typescript
queryKey: ['balance-sheets', currentOrganization?.id, filters]
mutationFn: (dto) => service.create(currentOrganization!.id, dto)
```

**Después**:
```typescript
queryKey: ['balance-sheets', filters]
mutationFn: (dto) => service.create(dto)
```

### 4. **Páginas de Balances**
📄 `src/app/dashboard/balances/page.tsx`
📄 `src/app/dashboard/balances/new/page.tsx`

**Cambios**:
- ❌ Removido: Import de `useOrganization`
- ❌ Removido: Verificación de `currentOrganization`
- ❌ Removido: Referencias a `currentOrganization.name`
- ✅ Funciona sin necesidad de seleccionar organización

### 5. **Migraciones de Base de Datos**

#### Migración 1: Hacer organization_id opcional
📄 `supabase/migrations/20250120000001_remove_organizations.sql`

**Cambios**:
- `organization_id` ahora es opcional (nullable) en todas las tablas:
  - `balance_sheets`
  - `balance_sheet_items`
  - `income_statements`
  - `income_statement_items`
  - `financial_indicators`
  - `audit_logs`

#### Migración 2: Actualizar políticas RLS
📄 `supabase/migrations/20250120000002_update_rls_policies.sql`

**Cambios**:
- Políticas RLS ahora filtran por `created_by` (usuario) en lugar de `organization_id`
- Elimina políticas antiguas basadas en organizaciones
- Crea nuevas políticas basadas en el usuario autenticado (`auth.uid()`)
- Aplica a todas las tablas:
  - `balance_sheets`: CRUD basado en `created_by`
  - `balance_sheet_items`: CRUD basado en el balance padre
  - `income_statements`: CRUD basado en `created_by`
  - `income_statement_items`: CRUD basado en el income statement padre
  - `financial_indicators`: CRUD basado en `created_by`
  - `audit_logs`: SELECT/INSERT basado en `user_id`

---

## 🚀 Cómo Aplicar los Cambios

### Paso 1: Ejecutar Migraciones en Supabase

**IMPORTANTE**: Debes ejecutar AMBAS migraciones en orden:

#### 1.1 Primera migración - Hacer organization_id opcional
1. Ve a tu proyecto en Supabase
2. Abre el SQL Editor
3. Ejecuta el archivo: `supabase/migrations/20250120000001_remove_organizations.sql`

```sql
-- Hacer organization_id opcional en todas las tablas
ALTER TABLE balance_sheets ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE balance_sheet_items ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE income_statements ALTER COLUMN organization_id DROP NOT NULL;
-- ... etc
```

#### 1.2 Segunda migración - Actualizar políticas RLS
4. En el mismo SQL Editor
5. Ejecuta el archivo: `supabase/migrations/20250120000002_update_rls_policies.sql`

```sql
-- Actualizar políticas RLS para usar created_by en lugar de organization_id
DROP POLICY IF EXISTS "Users can view balance sheets in their organization" ON balance_sheets;
CREATE POLICY "Users can view their own balance sheets"
ON balance_sheets FOR SELECT
USING (created_by = auth.uid());
-- ... etc
```

### Paso 2: Limpiar Datos de Prueba (Opcional)

Si quieres empezar desde cero:

```bash
# Ejecutar en Supabase SQL Editor
# Archivo: supabase/cleanup-test-data.sql
```

### Paso 3: Reiniciar el Servidor (si está corriendo)

```bash
# Detener el servidor actual
Ctrl + C

# Reiniciar
npm run dev
```

---

## 🎯 Beneficios

### 1. **Simplicidad**
- ❌ Ya no necesitas crear una organización para usar la app
- ❌ Ya no necesitas seleccionar organización
- ✅ Creas tu usuario y empiezas a crear balances directamente

### 2. **Experiencia de Usuario**
- Menos pasos para comenzar
- Interfaz más limpia
- Menos confusión para usuarios individuales

### 3. **Código Más Limpio**
- Menos verificaciones de organización
- Menos props pasados entre componentes
- Lógica más directa

---

## 📊 Antes vs Después

### Flujo Anterior (Con Organizaciones)
```
1. Registrarse
2. Crear organización
3. Seleccionar organización
4. Crear balance
```

### Flujo Actual (Sin Organizaciones)
```
1. Registrarse
2. Crear balance ✓
```

---

## 🔍 Verificación

### Comprobar que todo funciona:

1. **Iniciar sesión**
   - Dirígete a `/login`
   - Inicia sesión con tu usuario

2. **Ver página de balances**
   - Deberías ver la lista (vacía o con balances existentes)
   - No debería aparecer mensaje de "No hay organización seleccionada"

3. **Crear un balance**
   - Click en "Nuevo Balance"
   - El formulario debería aparecer sin pedir organización
   - Completa los campos y guarda
   - Debería crear el balance sin errores

4. **Verificar en base de datos**
   ```sql
   SELECT
       id,
       name,
       organization_id,  -- Debería ser NULL
       created_by,        -- Tu user ID
       fiscal_year
   FROM balance_sheets
   ORDER BY created_at DESC;
   ```

---

## ⚠️ Notas Importantes

### 1. **Datos Existentes**
- Los balances creados anteriormente con `organization_id` seguirán funcionando
- Solo los nuevos balances tendrán `organization_id = NULL`
- Puedes migrar datos viejos si lo necesitas

### 2. **RLS Policies**
Las políticas de seguridad (RLS) ahora filtran por `created_by`:

```sql
-- En balance_sheets
.eq('created_by', user.id)

-- Antes era:
.eq('organization_id', organizationId)
```

### 3. **Funcionalidad Multi-Usuario**
- Si en el futuro quieres agregar organizaciones de nuevo, puedes hacerlo
- La columna `organization_id` sigue existiendo, solo está en NULL
- Sería cuestión de revertir estos cambios

---

## 🎓 Para el Futuro

Si decides agregar organizaciones más adelante:

1. **Revertir la migración**:
   ```sql
   ALTER TABLE balance_sheets ALTER COLUMN organization_id SET NOT NULL;
   ```

2. **Restaurar hooks y servicios**:
   - Agregar parámetro `organizationId` nuevamente
   - Usar `organization_id` en queries

3. **Restaurar páginas**:
   - Agregar verificación de organización
   - Mostrar selector en sidebar

---

## 📝 Archivos Modificados

### Archivos Nuevos:
- `supabase/migrations/20250120000001_remove_organizations.sql` - Hacer organization_id opcional
- `supabase/migrations/20250120000002_update_rls_policies.sql` - Actualizar políticas RLS
- `ELIMINACION-ORGANIZACIONES.md` (este archivo)

### Archivos Modificados:
- `src/components/dashboard/Sidebar.tsx`
- `src/services/balance-sheet.service.ts`
- `src/lib/hooks/useBalanceSheet.ts`
- `src/app/dashboard/balances/page.tsx`
- `src/app/dashboard/balances/new/page.tsx`

---

## ✅ Checklist de Verificación

- [ ] Primera migración ejecutada en Supabase (20250120000001)
- [ ] Segunda migración ejecutada en Supabase (20250120000002)
- [ ] Servidor reiniciado
- [ ] Iniciar sesión funciona
- [ ] Página de balances carga sin errores
- [ ] Puede crear nuevo balance
- [ ] Balance se guarda correctamente
- [ ] Balance aparece en la lista
- [ ] No hay mensajes de "organización no seleccionada"

---

**Última actualización**: 2025-11-20
**Versión**: 2.0.0 - Sin módulo de organizaciones
