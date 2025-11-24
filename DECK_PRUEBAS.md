# 📋 Deck de Pruebas - Fluxi Finance
## Sistema de Diagnóstico Financiero

---

## 📌 Índice
1. [Módulo de Análisis de Costos](#módulo-de-análisis-de-costos)
2. [Módulo de Flujo de Caja](#módulo-de-flujo-de-caja)
3. [Módulo de Estado de Resultados](#módulo-de-estado-de-resultados)
4. [Módulo de Balance General](#módulo-de-balance-general)
5. [Módulo de Indicadores Financieros](#módulo-de-indicadores-financieros)

---

## 🎯 Módulo de Análisis de Costos

### Escenario 1: Producto Rentable - Tienda de Camisetas
**Objetivo:** Validar cálculos de punto de equilibrio y rentabilidad para un producto con margen saludable.

#### Datos a Ingresar:
- **Nombre del Producto:** Camiseta Polo Premium
- **Descripción:** Camiseta de algodón 100% con logo bordado
- **Precio de Venta Unitario:** $50,000 COP

**Costos Variables (por unidad):**
- Materia prima (tela): $15,000
- Mano de obra: $8,000
- Etiquetas y empaques: $2,000
- **Total Costos Variables:** $25,000

**Costos Fijos Mensuales:**
- Alquiler del local: $2,000,000
- Salarios administrativos: $3,000,000
- Servicios públicos: $500,000
- Seguros: $300,000
- Marketing: $700,000
- **Total Costos Fijos:** $6,500,000

**Datos de Producción:**
- Ventas Mensuales Actuales: 400 unidades
- Capacidad de Producción: 800 unidades/mes
- Año Fiscal: 2025

#### Resultados Esperados:
✅ **Margen de Contribución Unitario:** $25,000 ($50,000 - $25,000)
✅ **Margen de Contribución (%):** 50%
✅ **Punto de Equilibrio:** 260 unidades ($6,500,000 ÷ $25,000)
✅ **Punto de Equilibrio en Pesos:** $13,000,000
✅ **Ingresos Mensuales Actuales:** $20,000,000 (400 × $50,000)
✅ **Costos Variables Totales:** $10,000,000 (400 × $25,000)
✅ **Costos Totales:** $16,500,000 ($10,000,000 + $6,500,000)
✅ **Utilidad Mensual:** $3,500,000 ($20,000,000 - $16,500,000)
✅ **Margen de Seguridad:** 140 unidades (400 - 260)
✅ **Margen de Seguridad (%):** 35% (140 ÷ 400 × 100)
✅ **Apalancamiento Operativo:** 2.86 ($10,000,000 ÷ $3,500,000)
✅ **Utilización de Capacidad:** 50% (400 ÷ 800 × 100)

#### Validaciones a Realizar:
- [ ] El producto debe mostrar borde verde (rentable)
- [ ] El gráfico de punto de equilibrio debe mostrar la intersección en 260 unidades
- [ ] La interpretación debe indicar que estás por encima del punto de equilibrio
- [ ] Las recomendaciones deben ser positivas
- [ ] La exportación a PDF debe funcionar correctamente

---

### Escenario 2: Producto No Rentable - Panadería
**Objetivo:** Validar alertas y recomendaciones para un producto que opera por debajo del punto de equilibrio.

#### Datos a Ingresar:
- **Nombre del Producto:** Pan Francés Artesanal
- **Descripción:** Pan horneado diariamente con ingredientes premium
- **Precio de Venta Unitario:** $3,000 COP

**Costos Variables (por unidad):**
- Harina y levadura: $1,200
- Mantequilla y huevos: $800
- Empaque: $200
- **Total Costos Variables:** $2,200

**Costos Fijos Mensuales:**
- Alquiler: $1,500,000
- Salarios panaderos: $4,000,000
- Servicios públicos: $800,000
- Mantenimiento equipos: $200,000
- **Total Costos Fijos:** $6,500,000

**Datos de Producción:**
- Ventas Mensuales Actuales: 5,000 unidades
- Capacidad de Producción: 12,000 unidades/mes
- Año Fiscal: 2025

#### Resultados Esperados:
✅ **Margen de Contribución Unitario:** $800 ($3,000 - $2,200)
✅ **Margen de Contribución (%):** 26.67%
✅ **Punto de Equilibrio:** 8,125 unidades ($6,500,000 ÷ $800)
✅ **Punto de Equilibrio en Pesos:** $24,375,000
✅ **Ingresos Mensuales Actuales:** $15,000,000 (5,000 × $3,000)
✅ **Costos Variables Totales:** $11,000,000 (5,000 × $2,200)
✅ **Costos Totales:** $17,500,000 ($11,000,000 + $6,500,000)
✅ **Utilidad Mensual:** -$2,500,000 (PÉRDIDA)
✅ **Margen de Seguridad:** -3,125 unidades (negativo)
✅ **Unidades Faltantes para Equilibrio:** 3,125 unidades

#### Validaciones a Realizar:
- [ ] El producto debe mostrar borde rojo o gris (no rentable)
- [ ] Debe aparecer alerta "⚠️ Por debajo del punto de equilibrio"
- [ ] La utilidad debe mostrarse en rojo con valor negativo
- [ ] Las recomendaciones deben ser críticas/de advertencia
- [ ] El gráfico debe mostrar que las ventas actuales están a la izquierda del punto de equilibrio

---

### Escenario 3: Producto con Margen Ajustado - Servicio de Consultoría
**Objetivo:** Validar comportamiento con márgenes bajos y costos fijos altos.

#### Datos a Ingresar:
- **Nombre del Producto:** Consultoría Empresarial Mensual
- **Descripción:** Servicio de asesoría estratégica personalizada
- **Precio de Venta Unitario:** $2,500,000 COP

**Costos Variables (por servicio):**
- Honorarios consultor junior: $1,500,000
- Materiales y recursos: $200,000
- Desplazamientos: $100,000
- **Total Costos Variables:** $1,800,000

**Costos Fijos Mensuales:**
- Salarios equipo base: $8,000,000
- Oficina: $2,500,000
- Software y licencias: $1,000,000
- Marketing: $1,500,000
- **Total Costos Fijos:** $13,000,000

**Datos de Producción:**
- Ventas Mensuales Actuales: 20 servicios
- Capacidad de Producción: 30 servicios/mes
- Año Fiscal: 2025

#### Resultados Esperados:
✅ **Margen de Contribución Unitario:** $700,000
✅ **Margen de Contribución (%):** 28%
✅ **Punto de Equilibrio:** 18.57 ≈ 19 servicios
✅ **Ingresos Mensuales Actuales:** $50,000,000
✅ **Utilidad Mensual:** $1,000,000
✅ **Margen de Seguridad:** 1 servicio (muy bajo)
✅ **Margen de Seguridad (%):** 5% (crítico)

#### Validaciones a Realizar:
- [ ] Debe mostrar advertencia de margen de seguridad bajo
- [ ] Recomendación sobre precio ajustado
- [ ] Alto apalancamiento operativo (sensible a cambios en ventas)

---

## 💰 Módulo de Flujo de Caja

### Escenario 4: Empresa con Flujo de Caja Positivo - Restaurante
**Objetivo:** Validar cálculos de flujo de caja mensual y acumulado con tendencia positiva.

#### Datos a Ingresar:
- **Nombre:** Flujo de Caja Restaurante La Esquina
- **Año Fiscal:** 2025
- **Saldo Inicial:** $10,000,000

#### Entradas y Salidas Mensuales (Enero - Diciembre):

**ENERO:**
- Cobros de Ventas: $25,000,000
- Otros Ingresos: $1,000,000
- Total Entradas: $26,000,000
- Pagos a Proveedores: $12,000,000
- Nómina: $8,000,000
- Arriendo: $2,000,000
- Servicios: $1,500,000
- Impuestos: $500,000
- Otros Gastos: $500,000
- Total Salidas: $24,500,000
- **Flujo Neto Esperado:** $1,500,000
- **Acumulado Esperado:** $11,500,000

**FEBRERO:**
- Cobros de Ventas: $28,000,000
- Otros Ingresos: $500,000
- Total Entradas: $28,500,000
- Pagos a Proveedores: $13,000,000
- Nómina: $8,000,000
- Arriendo: $2,000,000
- Servicios: $1,600,000
- Impuestos: $800,000
- Otros Gastos: $600,000
- Total Salidas: $26,000,000
- **Flujo Neto Esperado:** $2,500,000
- **Acumulado Esperado:** $14,000,000

**MARZO:**
- Cobros de Ventas: $32,000,000
- Otros Ingresos: $2,000,000
- Total Entradas: $34,000,000
- Pagos a Proveedores: $15,000,000
- Nómina: $9,000,000
- Arriendo: $2,000,000
- Servicios: $1,700,000
- Impuestos: $1,200,000
- Otros Gastos: $800,000
- Total Salidas: $29,700,000
- **Flujo Neto Esperado:** $4,300,000
- **Acumulado Esperado:** $18,300,000

#### Resultados Esperados (Trimestre):
✅ **Total Entradas Q1:** $88,500,000
✅ **Total Salidas Q1:** $80,200,000
✅ **Flujo Neto Total Q1:** $8,300,000
✅ **Flujo Promedio Mensual:** $2,767,000
✅ **Meses Positivos:** 3 de 3
✅ **Meses Negativos:** 0
✅ **Score de Salud:** > 90 (Excelente)

#### Validaciones a Realizar:
- [ ] Los montos deben coincidir exactamente
- [ ] El acumulado debe aumentar mes a mes
- [ ] El score de salud debe ser verde (>70)
- [ ] Las recomendaciones deben ser positivas
- [ ] La tabla debe mostrar todos los valores correctamente coloreados

---

### Escenario 5: Empresa con Flujo de Caja Irregular - Startup
**Objetivo:** Validar cálculos con meses negativos y positivos alternados.

#### Datos a Ingresar:
- **Nombre:** Flujo de Caja Startup Tech
- **Año Fiscal:** 2025
- **Saldo Inicial:** $50,000,000

#### Entradas y Salidas Mensuales:

**ENERO (Mes Negativo - Inversión en Desarrollo):**
- Cobros de Ventas: $5,000,000
- Otros Ingresos: $0
- Total Entradas: $5,000,000
- Pagos a Proveedores: $8,000,000
- Nómina: $15,000,000
- Arriendo: $3,000,000
- Servicios: $2,000,000
- Impuestos: $500,000
- Otros Gastos: $1,500,000
- Total Salidas: $30,000,000
- **Flujo Neto Esperado:** -$25,000,000
- **Acumulado Esperado:** $25,000,000

**FEBRERO (Mes Negativo):**
- Cobros de Ventas: $8,000,000
- Otros Ingresos: $2,000,000
- Total Entradas: $10,000,000
- Pagos a Proveedores: $6,000,000
- Nómina: $15,000,000
- Arriendo: $3,000,000
- Servicios: $2,000,000
- Impuestos: $300,000
- Otros Gastos: $1,000,000
- Total Salidas: $27,300,000
- **Flujo Neto Esperado:** -$17,300,000
- **Acumulado Esperado:** $7,700,000

**MARZO (Mes Positivo - Ingreso de Cliente Grande):**
- Cobros de Ventas: $45,000,000
- Otros Ingresos: $5,000,000
- Total Entradas: $50,000,000
- Pagos a Proveedores: $10,000,000
- Nómina: $15,000,000
- Arriendo: $3,000,000
- Servicios: $2,500,000
- Impuestos: $3,000,000
- Otros Gastos: $2,000,000
- Total Salidas: $35,500,000
- **Flujo Neto Esperado:** $14,500,000
- **Acumulado Esperado:** $22,200,000

#### Resultados Esperados:
✅ **Flujo Promedio Mensual:** -$9,267,000 (promedio de los 3 meses)
✅ **Meses Positivos:** 1 de 3
✅ **Meses Negativos:** 2 de 3
✅ **Score de Salud:** 30-40 (Riesgo)

#### Validaciones a Realizar:
- [ ] Los meses negativos deben mostrarse claramente en rojo
- [ ] El acumulado puede bajar en meses negativos
- [ ] Debe haber advertencias sobre la situación de riesgo
- [ ] Las recomendaciones deben incluir alertas sobre liquidez

---

## 📊 Módulo de Estado de Resultados

### Escenario 6: Empresa Manufacturera Rentable
**Objetivo:** Validar cálculos completos de P&L con múltiples categorías de ingresos y gastos.

#### Datos a Ingresar:
- **Nombre:** Estado de Resultados Fábrica XYZ
- **Período:** Q1 2025 (Enero - Marzo)
- **Año Fiscal:** 2025

#### Ingresos:
- **Ventas de Productos:** $180,000,000
- **Ingresos por Servicios:** $20,000,000
- **Otros Ingresos:** $5,000,000
- **Total Ingresos Esperado:** $205,000,000

#### Costos de Ventas:
- **Materia Prima:** $60,000,000
- **Mano de Obra Directa:** $35,000,000
- **Costos Indirectos de Fabricación:** $15,000,000
- **Total Costo de Ventas Esperado:** $110,000,000
- **Utilidad Bruta Esperada:** $95,000,000 (46.3%)

#### Gastos Operacionales:
- **Salarios Administrativos:** $18,000,000
- **Marketing y Publicidad:** $12,000,000
- **Arriendo y Servicios:** $8,000,000
- **Depreciación:** $4,000,000
- **Otros Gastos Operacionales:** $3,000,000
- **Total Gastos Operacionales Esperado:** $45,000,000
- **EBITDA Esperado:** $54,000,000
- **Utilidad Operacional Esperada:** $50,000,000 (24.4%)

#### Gastos No Operacionales:
- **Gastos Financieros (Intereses):** $3,000,000
- **Pérdida en Venta de Activos:** $1,000,000
- **Otros Gastos No Operacionales:** $1,000,000
- **Total Gastos No Operacionales Esperado:** $5,000,000

#### Impuestos:
- **Impuesto de Renta (35%):** $15,750,000

#### Resultados Finales Esperados:
✅ **Utilidad Antes de Impuestos:** $45,000,000
✅ **Utilidad Neta:** $29,250,000
✅ **Margen Bruto:** 46.3%
✅ **Margen Operacional:** 24.4%
✅ **Margen Neto:** 14.3%

#### Validaciones a Realizar:
- [ ] Todos los subtotales deben calcularse correctamente
- [ ] Los márgenes porcentuales deben mostrarse
- [ ] La utilidad neta debe ser positiva y mostrarse en verde
- [ ] El gráfico de composición debe reflejar las proporciones correctas

---

### Escenario 7: Empresa con Pérdida Operacional
**Objetivo:** Validar presentación de estados con pérdidas.

#### Datos a Ingresar:
- **Nombre:** Estado de Resultados Empresa en Reestructuración
- **Período:** Q4 2024
- **Año Fiscal:** 2024

#### Datos Simplificados:
- **Total Ingresos:** $50,000,000
- **Costo de Ventas:** $35,000,000
- **Utilidad Bruta Esperada:** $15,000,000 (30%)
- **Gastos Operacionales:** $25,000,000
- **Utilidad Operacional Esperada:** -$10,000,000 (PÉRDIDA)
- **Gastos No Operacionales:** $5,000,000
- **Pérdida Neta Esperada:** -$15,000,000

#### Validaciones a Realizar:
- [ ] Los valores negativos deben mostrarse en rojo
- [ ] Debe haber alertas sobre la situación financiera
- [ ] Los márgenes negativos deben calcularse correctamente

---

## 🏦 Módulo de Balance General

### Escenario 8: Balance General Equilibrado - Comercializadora
**Objetivo:** Validar la ecuación contable básica (Activos = Pasivos + Patrimonio).

#### Datos a Ingresar:
- **Nombre:** Balance General Comercializadora ABC
- **Fecha de Corte:** 31 de Marzo 2025
- **Año Fiscal:** 2025

#### ACTIVOS CORRIENTES:
- **Efectivo y Equivalentes:**
  - Caja: $5,000,000
  - Bancos: $25,000,000
  - Inversiones Temporales: $10,000,000
  - Subtotal: $40,000,000

- **Cuentas por Cobrar:**
  - Clientes: $35,000,000
  - Otras Cuentas por Cobrar: $5,000,000
  - Subtotal: $40,000,000

- **Inventarios:**
  - Mercancía: $45,000,000
  - Subtotal: $45,000,000

- **Otros Activos Corrientes:** $5,000,000

**Total Activos Corrientes Esperado:** $130,000,000

#### ACTIVOS NO CORRIENTES:
- **Propiedades, Planta y Equipo:**
  - Terrenos: $50,000,000
  - Edificios: $80,000,000
  - Maquinaria y Equipo: $40,000,000
  - Vehículos: $15,000,000
  - (-) Depreciación Acumulada: -$35,000,000
  - Subtotal: $150,000,000

- **Inversiones Largo Plazo:** $20,000,000
- **Intangibles:** $10,000,000

**Total Activos No Corrientes Esperado:** $180,000,000

**TOTAL ACTIVOS ESPERADO:** $310,000,000

#### PASIVOS CORRIENTES:
- **Cuentas por Pagar:**
  - Proveedores: $40,000,000
  - Otras Cuentas por Pagar: $10,000,000
  - Subtotal: $50,000,000

- **Obligaciones Financieras Corto Plazo:** $20,000,000
- **Impuestos por Pagar:** $8,000,000
- **Otros Pasivos Corrientes:** $7,000,000

**Total Pasivos Corrientes Esperado:** $85,000,000

#### PASIVOS NO CORRIENTES:
- **Obligaciones Financieras Largo Plazo:** $80,000,000
- **Otros Pasivos Largo Plazo:** $5,000,000

**Total Pasivos No Corrientes Esperado:** $85,000,000

**TOTAL PASIVOS ESPERADO:** $170,000,000

#### PATRIMONIO:
- **Capital Social:** $100,000,000
- **Reservas:** $15,000,000
- **Utilidades Retenidas:** $10,000,000
- **Utilidad del Ejercicio:** $15,000,000

**TOTAL PATRIMONIO ESPERADO:** $140,000,000

#### Validaciones Críticas:
✅ **Ecuación Contable:** $310,000,000 = $170,000,000 + $140,000,000 ✓
✅ **Razón Corriente:** 1.53 ($130M ÷ $85M)
✅ **Capital de Trabajo:** $45,000,000 ($130M - $85M)
✅ **Nivel de Endeudamiento:** 54.8% ($170M ÷ $310M)

#### Validaciones a Realizar:
- [ ] La ecuación contable debe estar balanceada (Activos = Pasivos + Patrimonio)
- [ ] Debe mostrar alerta si no está balanceado
- [ ] Los subtotales de cada sección deben ser correctos
- [ ] Los indicadores de liquidez deben calcularse automáticamente

---

### Escenario 9: Balance con Desequilibrio (Prueba Negativa)
**Objetivo:** Validar detección de errores en la ecuación contable.

#### Datos a Ingresar (Deliberadamente Desbalanceado):
- **Total Activos:** $200,000,000
- **Total Pasivos:** $90,000,000
- **Total Patrimonio:** $100,000,000
- **Suma P+P:** $190,000,000

#### Validaciones a Realizar:
- [ ] Debe mostrar ERROR: Diferencia de $10,000,000
- [ ] El balance debe estar marcado como "No Balanceado"
- [ ] Debe sugerir revisión de las cifras ingresadas
- [ ] No debe permitir finalizar/guardar como definitivo

---

## 📈 Módulo de Indicadores Financieros

### Escenario 10: Análisis Integral de Indicadores
**Objetivo:** Validar cálculo de todos los indicadores a partir de los estados financieros.

#### Pre-requisitos:
- Tener cargado el Balance General del Escenario 8
- Tener cargado el Estado de Resultados del Escenario 6
- Tener cargado el Flujo de Caja del Escenario 4

#### Indicadores de Liquidez Esperados:
✅ **Razón Corriente:** 1.53
- Interpretación: Por cada $1 de pasivo corriente, hay $1.53 de activo corriente
- Estado: SALUDABLE (> 1.5)

✅ **Prueba Ácida:** 1.00 (($130M - $45M) ÷ $85M)
- Interpretación: Liquidez sin depender de inventarios
- Estado: ACEPTABLE (= 1.0)

✅ **Capital de Trabajo:** $45,000,000
- Estado: POSITIVO

#### Indicadores de Rentabilidad Esperados:
✅ **ROA (Retorno sobre Activos):** 9.4% ($29.25M ÷ $310M)
✅ **ROE (Retorno sobre Patrimonio):** 20.9% ($29.25M ÷ $140M)
✅ **Margen Neto:** 14.3%
✅ **Margen Operacional:** 24.4%
✅ **Margen EBITDA:** 26.3%

#### Indicadores de Endeudamiento Esperados:
✅ **Nivel de Endeudamiento:** 54.8% ($170M ÷ $310M)
✅ **Endeudamiento Financiero:** 32.3% ($100M ÷ $310M)
✅ **Cobertura de Intereses:** 16.67x ($50M ÷ $3M)

#### Indicadores de Eficiencia Esperados:
✅ **Rotación de Activos:** 0.66x ($205M ÷ $310M)
✅ **Rotación de Inventarios:** 2.44x ($110M ÷ $45M)
✅ **Días de Inventario:** 149 días (365 ÷ 2.44)
✅ **Días de Cartera:** 62 días (($35M ÷ $205M) × 365)

#### Validaciones a Realizar:
- [ ] Todos los indicadores deben calcularse automáticamente
- [ ] Cada indicador debe tener su interpretación
- [ ] Los rangos de color (verde/amarillo/rojo) deben ser apropiados
- [ ] El dashboard debe mostrar resumen con semáforos
- [ ] La exportación PDF debe incluir todos los indicadores

---

## ✅ Checklist General de Validaciones

### Funcionalidades Transversales:

#### 1. Gestión de Organizaciones
- [ ] Crear nueva organización
- [ ] Cambiar entre organizaciones
- [ ] Los datos deben filtrarse por organización seleccionada

#### 2. Exportación de Reportes
- [ ] Exportar cada módulo a PDF
- [ ] El PDF debe contener todos los datos visibles
- [ ] El PDF debe tener formato profesional
- [ ] Los cálculos en PDF deben coincidir con la pantalla

#### 3. Edición y Eliminación
- [ ] Editar registros existentes
- [ ] Los cambios deben reflejarse en cálculos
- [ ] Eliminar registros (solo borradores donde aplique)
- [ ] Confirmación antes de eliminar

#### 4. Validaciones de Formularios
- [ ] Campos requeridos deben validarse
- [ ] Números no pueden ser negativos (donde aplique)
- [ ] Fechas deben ser coherentes
- [ ] Mensajes de error claros

#### 5. Interfaz de Usuario
- [ ] Colores consistentes en toda la aplicación
- [ ] Tooltips informativos funcionan correctamente
- [ ] Responsive design en móvil y tablet
- [ ] Loading states durante operaciones

#### 6. Integridad de Datos
- [ ] Los totales se calculan correctamente
- [ ] Los porcentajes suman 100% donde corresponde
- [ ] No hay errores de redondeo significativos
- [ ] Los datos persisten después de recargar

---

## 🎯 Matriz de Cobertura de Pruebas

| Módulo | Escenarios | Cálculos | UI/UX | Exportación | Edición |
|--------|-----------|----------|-------|-------------|---------|
| Análisis de Costos | ✅ 3 | ✅ 12 | ✅ | ✅ | ✅ |
| Flujo de Caja | ✅ 2 | ✅ 8 | ✅ | ✅ | ✅ |
| Estado de Resultados | ✅ 2 | ✅ 10 | ✅ | ✅ | ✅ |
| Balance General | ✅ 2 | ✅ 15 | ✅ | ✅ | ✅ |
| Indicadores | ✅ 1 | ✅ 12 | ✅ | ✅ | - |

**Total de Pruebas:** 10 Escenarios | 57+ Validaciones de Cálculos

---

## 📝 Notas para el Tester

### Formato de Reporte de Bugs:
```
**ID:** BUG-001
**Módulo:** [Nombre del módulo]
**Escenario:** [Número de escenario]
**Severidad:** [Alta/Media/Baja]
**Descripción:** [Qué pasó]
**Esperado:** [Qué debería pasar]
**Pasos para Reproducir:**
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]
**Evidencia:** [Screenshot o descripción]
```

### Consideraciones Importantes:
1. **Redondeo:** Los cálculos pueden tener diferencias menores (±$1) debido al redondeo. Esto es aceptable.
2. **Formato de Moneda:** Todos los valores deben usar el formato colombiano: $X.XXX.XXX
3. **Porcentajes:** Deben mostrarse con 1-2 decimales máximo
4. **Fechas:** Formato DD/MM/YYYY o nombres de mes en español

### Prioridad de Pruebas:
🔴 **Alta:** Cálculos financieros, ecuación contable, punto de equilibrio
🟡 **Media:** Validaciones de formularios, exportación PDF
🟢 **Baja:** Detalles visuales, tooltips, animaciones

---

## 🚀 Instrucciones de Ejecución

1. **Preparación:**
   - Crear una organización de prueba llamada "Empresa de Pruebas QA"
   - Limpiar datos previos si es necesario
   - Tener calculadora a mano para verificar cálculos

2. **Ejecución:**
   - Seguir los escenarios en orden
   - Marcar cada validación con ✅ o ❌
   - Documentar cualquier discrepancia

3. **Reporte:**
   - Consolidar todos los bugs encontrados
   - Calcular tasa de éxito (validaciones pasadas / total)
   - Priorizar correcciones

---

**Versión del Documento:** 1.0
**Fecha de Creación:** 24 de Enero 2025
**Última Actualización:** 24 de Enero 2025
