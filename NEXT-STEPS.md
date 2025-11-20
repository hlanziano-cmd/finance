# Próximos Pasos - Funcionalidad de Guardado de Balance Completo

## 🎯 Objetivo

Actualmente el formulario de balance calcula y valida correctamente la ecuación contable, pero **solo guarda la información básica del balance** (nombre, fechas, año fiscal).

**Necesitamos**: Guardar también todos los valores de las cuentas contables que el usuario ingresó.

---

## 📋 Estado Actual

### ✅ Lo que ya funciona:

1. **Formulario completo** con todas las cuentas PUC
2. **Tooltips educativos** en cada cuenta
3. **Validación de ecuación contable** en tiempo real
4. **Cálculo de totales** por sección
5. **Prevención de guardado** si no está cuadrado

### ❌ Lo que falta:

- Guardar los valores de cada cuenta como `balance_sheet_items`
- Cada cuenta con valor > 0 debe crear un registro en la tabla `balance_sheet_items`

---

## 🔧 Cómo Implementarlo

### Paso 1: Extender el servicio de Balance

Archivo: `src/services/balance-sheet.service.ts`

Modificar el método `create()` para aceptar items:

```typescript
// ANTES (solo guarda balance básico)
async create(
  organizationId: string,
  dto: CreateBalanceSheetDTO
): Promise<BalanceSheet>

// DESPUÉS (guarda balance + items)
async create(
  organizationId: string,
  dto: CreateBalanceSheetDTO,
  items?: BalanceSheetItemInput[] // NUEVO parámetro
): Promise<BalanceSheet>
```

### Paso 2: Agregar tipo para los items

Archivo: `src/types/dtos.ts`

```typescript
export interface BalanceSheetItemInput {
  code: string;        // Código PUC (ej: '1105')
  name: string;        // Nombre de la cuenta
  amount: number;      // Valor ingresado
  category: 'activo' | 'pasivo' | 'patrimonio';
  subcategory: string; // 'corriente', 'no_corriente', 'capital', etc.
}
```

### Paso 3: Modificar el método create() en el servicio

```typescript
async create(
  organizationId: string,
  dto: CreateBalanceSheetDTO,
  items?: BalanceSheetItemInput[]
): Promise<BalanceSheet> {
  // Validar DTO
  const validation = createBalanceSheetSchema.safeParse(dto);
  if (!validation.success) {
    throw new ValidationError(validation.error.issues.map(issue => ({
      message: issue.message,
      path: issue.path.map(String),
    })));
  }

  // Obtener usuario actual
  const { data: { user } } = await this.supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  // 1. Insertar balance
  const { data: balanceData, error: balanceError } = await this.supabase
    .from('balance_sheets')
    .insert({
      organization_id: organizationId,
      name: dto.name,
      period_start: dto.periodStart.toISOString(),
      period_end: dto.periodEnd.toISOString(),
      fiscal_year: dto.fiscalYear,
      notes: dto.notes,
      created_by: user.id,
    })
    .select()
    .single();

  if (balanceError || !balanceData) {
    throw new DatabaseError(balanceError?.message || 'Error al crear balance');
  }

  // 2. Insertar items si existen
  if (items && items.length > 0) {
    const itemsToInsert = items.map((item, index) => ({
      balance_sheet_id: balanceData.id,
      organization_id: organizationId,
      category: item.category,
      subcategory: item.subcategory,
      account_name: item.name,
      account_code: item.code,
      amount: item.amount,
      order_index: index,
    }));

    const { error: itemsError } = await this.supabase
      .from('balance_sheet_items')
      .insert(itemsToInsert);

    if (itemsError) {
      // Rollback: eliminar el balance si falla la inserción de items
      await this.supabase
        .from('balance_sheets')
        .delete()
        .eq('id', balanceData.id);

      throw new DatabaseError(`Error al guardar items: ${itemsError.message}`);
    }
  }

  // Registrar en audit log
  await this.createAuditLog(organizationId, 'create', 'balance_sheet', balanceData.id);

  // Retornar balance completo con items
  return this.getById(balanceData.id);
}
```

### Paso 4: Actualizar el formulario

Archivo: `src/app/dashboard/balances/new/page.tsx`

Modificar la función `handleSubmit`:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validation.isValid) {
    alert('El balance no está cuadrado. Por favor revisa los valores ingresados.');
    return;
  }

  if (!balanceName || !periodStart || !periodEnd) {
    alert('Por favor completa todos los campos obligatorios');
    return;
  }

  try {
    // 1. Crear array de items con valores > 0
    const allAccounts = [
      ...ACTIVO_CORRIENTE,
      ...ACTIVO_NO_CORRIENTE,
      ...PASIVO_CORRIENTE,
      ...PASIVO_NO_CORRIENTE,
      ...PATRIMONIO,
    ];

    const items = allAccounts
      .filter(account => (accountValues[account.code] || 0) > 0)
      .map(account => ({
        code: account.code,
        name: account.name,
        amount: accountValues[account.code],
        category: account.category,
        subcategory: account.subcategory,
      }));

    // 2. Llamar al servicio con items
    // Nota: Necesitarás crear un nuevo hook o extender useCreateBalanceSheet
    await createBalanceWithItemsMutation.mutateAsync({
      balance: {
        name: balanceName,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        fiscalYear,
      },
      items,
    });

    router.push('/dashboard/balances');
  } catch (error) {
    console.error('Error al crear balance:', error);
    alert('Error al crear el balance. Por favor intenta nuevamente.');
  }
};
```

### Paso 5: Crear nuevo hook o extender el existente

Archivo: `src/lib/hooks/useBalanceSheet.ts`

**Opción A: Nuevo hook**
```typescript
export function useCreateBalanceWithItems() {
  const supabase = useSupabase();
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const service = new BalanceSheetService(supabase);

  return useMutation({
    mutationFn: ({ balance, items }: {
      balance: CreateBalanceSheetDTO;
      items: BalanceSheetItemInput[];
    }) => service.create(currentOrganization!.id, balance, items),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['balance-sheets'] });
      toast.success('Balance creado exitosamente con todas sus cuentas');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear balance: ${error.message}`);
    },
  });
}
```

**Opción B: Modificar hook existente**
```typescript
// Cambiar useCreateBalanceSheet para aceptar items
export function useCreateBalanceSheet() {
  const supabase = useSupabase();
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const service = new BalanceSheetService(supabase);

  return useMutation({
    mutationFn: ({ balance, items }: {
      balance: CreateBalanceSheetDTO;
      items?: BalanceSheetItemInput[];
    }) => service.create(currentOrganization!.id, balance, items),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['balance-sheets'] });
      const message = items?.length
        ? `Balance creado con ${items.length} cuentas`
        : 'Balance creado exitosamente';
      toast.success(message);
    },
    onError: (error: Error) => {
      toast.error(`Error al crear balance: ${error.message}`);
    },
  });
}
```

---

## 🧪 Cómo Probar

### Prueba 1: Balance Simple

1. Ve a "Nuevo Balance"
2. Ingresa solo 3 cuentas:
   - Caja: $10,000,000
   - Proveedores: $3,000,000
   - Capital social: $7,000,000
3. Verifica que esté cuadrado
4. Guarda
5. **Resultado esperado**:
   - 1 registro en `balance_sheets`
   - 3 registros en `balance_sheet_items`

### Prueba 2: Balance Completo

1. Ingresa valores en 10-15 cuentas diferentes
2. Asegúrate de que esté cuadrado
3. Guarda
4. **Resultado esperado**:
   - 1 registro en `balance_sheets`
   - 10-15 registros en `balance_sheet_items`

### Prueba 3: Validación

1. Ingresa valores descuadrados
2. Intenta guardar
3. **Resultado esperado**:
   - Botón "Guardar" deshabilitado
   - Mensaje en rojo mostrando diferencia

---

## 📊 Verificación en Base de Datos

### Query para verificar que se guardó correctamente:

```sql
-- Ver el balance con sus items
SELECT
    bs.name as balance,
    bs.fiscal_year,
    bsi.account_code,
    bsi.account_name,
    bsi.category,
    bsi.amount
FROM balance_sheets bs
LEFT JOIN balance_sheet_items bsi ON bs.id = bsi.balance_sheet_id
WHERE bs.organization_id = 'TU_ORG_ID'
ORDER BY bs.created_at DESC, bsi.order_index;

-- Verificar totales
SELECT
    bs.name,
    SUM(CASE WHEN bsi.category = 'activo' THEN bsi.amount ELSE 0 END) as total_activo,
    SUM(CASE WHEN bsi.category = 'pasivo' THEN bsi.amount ELSE 0 END) as total_pasivo,
    SUM(CASE WHEN bsi.category = 'patrimonio' THEN bsi.amount ELSE 0 END) as total_patrimonio
FROM balance_sheets bs
JOIN balance_sheet_items bsi ON bs.id = bsi.balance_sheet_id
WHERE bs.organization_id = 'TU_ORG_ID'
GROUP BY bs.id, bs.name;
```

---

## 🚨 Consideraciones Importantes

### 1. Transacciones

El código debe manejar transacciones correctamente:
- Si falla la creación de items, debe hacer rollback del balance
- Usar `BEGIN`, `COMMIT`, `ROLLBACK` si es necesario

### 2. Validación en Backend

Además de la validación en frontend, el servicio debe validar:
- Que los códigos de cuenta sean válidos
- Que los montos sean positivos
- Que la ecuación contable esté cuadrada

```typescript
// Agregar al inicio del método create()
if (items && items.length > 0) {
  const totalActivo = items
    .filter(i => i.category === 'activo')
    .reduce((sum, i) => sum + i.amount, 0);

  const totalPasivo = items
    .filter(i => i.category === 'pasivo')
    .reduce((sum, i) => sum + i.amount, 0);

  const totalPatrimonio = items
    .filter(i => i.category === 'patrimonio')
    .reduce((sum, i) => sum + i.amount, 0);

  const difference = Math.abs(totalActivo - (totalPasivo + totalPatrimonio));

  if (difference > 0.01) {
    throw new ValidationError([{
      message: `Balance descuadrado. Diferencia: $${difference.toFixed(2)}`,
      path: ['items']
    }]);
  }
}
```

### 3. Manejo de Errores

Mostrar mensajes claros al usuario:
```typescript
try {
  await createBalance();
  toast.success('Balance creado exitosamente');
  router.push('/dashboard/balances');
} catch (error) {
  if (error instanceof ValidationError) {
    toast.error('Error de validación: ' + error.message);
  } else if (error instanceof DatabaseError) {
    toast.error('Error de base de datos: ' + error.message);
  } else {
    toast.error('Error inesperado al crear el balance');
  }
  console.error('Error detallado:', error);
}
```

---

## 📈 Siguientes Mejoras (Después de esto)

Una vez que el guardado funcione correctamente, puedes agregar:

1. **Página de detalle del balance**
   - Ver balance completo guardado
   - Mostrar ecuación contable
   - Botón para editar (si está en draft)

2. **Edición de balances**
   - Solo permitir si `status = 'draft'`
   - Cargar valores actuales en el formulario
   - Actualizar balance + items

3. **Cálculo automático de totales**
   - Usar la función SQL `calculate_balance_totals`
   - Guardar totales en el balance
   - Mostrar en la lista de balances

4. **Exportación a PDF**
   - Formato profesional de Balance General
   - Incluir logo de la empresa
   - Firmas digitales

5. **Comparación de períodos**
   - Ver dos balances lado a lado
   - Calcular variaciones
   - Análisis de tendencias

---

## 🎯 Resumen

**Cambios necesarios**:
1. ✏️ Extender `BalanceSheetService.create()` para aceptar items
2. ✏️ Crear tipo `BalanceSheetItemInput` en dtos
3. ✏️ Modificar `handleSubmit` en el formulario para enviar items
4. ✏️ Extender o crear nuevo hook para el mutation
5. ✅ Probar con balance simple y completo
6. ✅ Verificar en base de datos

**Archivos a modificar**:
- `src/services/balance-sheet.service.ts`
- `src/types/dtos.ts`
- `src/app/dashboard/balances/new/page.tsx`
- `src/lib/hooks/useBalanceSheet.ts`

**Tiempo estimado**: 1-2 horas de desarrollo + pruebas

---

**¡Mucha suerte con la implementación! Si necesitas ayuda, revisa los comentarios en el código y la documentación de Supabase.**
