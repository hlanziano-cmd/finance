// src/lib/constants/chart-of-accounts.ts
/**
 * Plan Único de Cuentas (PUC) para Colombia
 * Versión simplificada con las cuentas principales del Balance General
 */

export interface AccountDefinition {
  code: string;
  name: string;
  description: string;
  category: 'activo' | 'pasivo' | 'patrimonio';
  subcategory: string;
  examples?: string[];
  formula?: string;
}

/**
 * CUENTAS DE ACTIVO
 * Todo lo que la empresa POSEE y tiene valor económico
 */
export const ACTIVO_CORRIENTE: AccountDefinition[] = [
  {
    code: '1105',
    name: 'Caja',
    description: 'Dinero en efectivo disponible inmediatamente en la empresa (billetes, monedas).',
    category: 'activo',
    subcategory: 'corriente',
    examples: ['Efectivo en caja menor', 'Dinero para gastos diarios'],
  },
  {
    code: '1110',
    name: 'Bancos',
    description: 'Dinero depositado en cuentas bancarias de la empresa (corrientes y ahorros).',
    category: 'activo',
    subcategory: 'corriente',
    examples: ['Cuenta corriente Bancolombia', 'Cuenta de ahorros Davivienda'],
  },
  {
    code: '1305',
    name: 'Clientes',
    description: 'Dinero que los clientes deben a la empresa por ventas a crédito (cuentas por cobrar).',
    category: 'activo',
    subcategory: 'corriente',
    examples: ['Facturas pendientes de pago', 'Ventas a crédito no cobradas'],
  },
  {
    code: '1435',
    name: 'Mercancías no fabricadas por la empresa',
    description: 'Productos que la empresa compra y vende sin transformar (inventarios para comercializar).',
    category: 'activo',
    subcategory: 'corriente',
    examples: ['Productos en bodega', 'Mercancía lista para vender'],
  },
  {
    code: '1355',
    name: 'Anticipo de impuestos y contribuciones',
    description: 'Pagos adelantados de impuestos que se pueden descontar más adelante.',
    category: 'activo',
    subcategory: 'corriente',
    examples: ['Retención en la fuente a favor', 'IVA pagado por anticipado'],
  },
];

export const ACTIVO_NO_CORRIENTE: AccountDefinition[] = [
  {
    code: '1516',
    name: 'Construcciones y edificaciones',
    description: 'Inmuebles y edificios propiedad de la empresa (locales, bodegas, oficinas).',
    category: 'activo',
    subcategory: 'no_corriente',
    examples: ['Local comercial', 'Bodega de almacenamiento', 'Oficinas administrativas'],
  },
  {
    code: '1520',
    name: 'Maquinaria y equipo',
    description: 'Máquinas y equipos usados en la producción o prestación de servicios.',
    category: 'activo',
    subcategory: 'no_corriente',
    examples: ['Máquinas industriales', 'Equipos de producción', 'Herramientas especializadas'],
  },
  {
    code: '1524',
    name: 'Equipo de oficina',
    description: 'Muebles y equipos usados en las oficinas administrativas.',
    category: 'activo',
    subcategory: 'no_corriente',
    examples: ['Escritorios', 'Sillas', 'Archivadores', 'Teléfonos'],
  },
  {
    code: '1528',
    name: 'Equipo de computación y comunicación',
    description: 'Computadores, servidores y equipos tecnológicos de la empresa.',
    category: 'activo',
    subcategory: 'no_corriente',
    examples: ['Computadores', 'Laptops', 'Servidores', 'Impresoras', 'Routers'],
  },
  {
    code: '1540',
    name: 'Flota y equipo de transporte',
    description: 'Vehículos propiedad de la empresa usados para transporte o distribución.',
    category: 'activo',
    subcategory: 'no_corriente',
    examples: ['Camiones de reparto', 'Vehículos de servicio', 'Motos mensajeras'],
  },
];

/**
 * CUENTAS DE PASIVO
 * Todo lo que la empresa DEBE a terceros
 */
export const PASIVO_CORRIENTE: AccountDefinition[] = [
  {
    code: '2205',
    name: 'Proveedores nacionales',
    description: 'Dinero que la empresa debe a proveedores por compras a crédito.',
    category: 'pasivo',
    subcategory: 'corriente',
    examples: ['Facturas de proveedores pendientes de pago', 'Compras a crédito'],
  },
  {
    code: '2335',
    name: 'Costos y gastos por pagar',
    description: 'Gastos ya causados pero que aún no se han pagado (servicios, arriendos, etc).',
    category: 'pasivo',
    subcategory: 'corriente',
    examples: ['Arriendo del mes por pagar', 'Servicios públicos pendientes', 'Honorarios por pagar'],
  },
  {
    code: '2365',
    name: 'Retención en la fuente',
    description: 'Impuestos retenidos a terceros que deben ser pagados a la DIAN.',
    category: 'pasivo',
    subcategory: 'corriente',
    examples: ['Retención en la fuente por servicios', 'Retención por honorarios'],
  },
  {
    code: '2404',
    name: 'Impuesto a las ventas por pagar (IVA)',
    description: 'IVA cobrado en ventas que debe pagarse al gobierno.',
    category: 'pasivo',
    subcategory: 'corriente',
    examples: ['IVA de las facturas de venta', 'IVA pendiente de declarar'],
  },
  {
    code: '2505',
    name: 'Salarios por pagar',
    description: 'Sueldos de empleados que ya se devengaron pero aún no se han pagado.',
    category: 'pasivo',
    subcategory: 'corriente',
    examples: ['Nómina del mes pendiente', 'Salarios a pagar el próximo mes'],
  },
  {
    code: '2510',
    name: 'Cesantías consolidadas',
    description: 'Ahorro obligatorio por cada empleado equivalente a un mes de salario por año trabajado.',
    category: 'pasivo',
    subcategory: 'corriente',
    examples: ['Cesantías acumuladas de empleados'],
  },
];

export const PASIVO_NO_CORRIENTE: AccountDefinition[] = [
  {
    code: '2105',
    name: 'Bancos nacionales',
    description: 'Préstamos y créditos bancarios que la empresa debe pagar a largo plazo (más de un año).',
    category: 'pasivo',
    subcategory: 'no_corriente',
    examples: ['Crédito para compra de maquinaria', 'Préstamo hipotecario', 'Leasing financiero'],
  },
  {
    code: '2335',
    name: 'Obligaciones laborales',
    description: 'Deudas con empleados por prestaciones sociales de largo plazo.',
    category: 'pasivo',
    subcategory: 'no_corriente',
    examples: ['Pensiones por pagar', 'Indemnizaciones futuras'],
  },
];

/**
 * CUENTAS DE PATRIMONIO
 * Recursos propios de la empresa (aportes de socios + utilidades acumuladas)
 */
export const PATRIMONIO: AccountDefinition[] = [
  {
    code: '3105',
    name: 'Capital social',
    description: 'Dinero o bienes que los socios aportaron inicialmente para crear la empresa.',
    category: 'patrimonio',
    subcategory: 'capital',
    examples: ['Aportes iniciales de los socios', 'Capital fundacional'],
  },
  {
    code: '3305',
    name: 'Reservas obligatorias',
    description: 'Parte de las utilidades que por ley debe guardarse (10% de utilidades hasta llegar al 50% del capital).',
    category: 'patrimonio',
    subcategory: 'reservas',
    examples: ['Reserva legal acumulada'],
  },
  {
    code: '3605',
    name: 'Utilidades acumuladas',
    description: 'Ganancias de años anteriores que no se han repartido a los socios.',
    category: 'patrimonio',
    subcategory: 'resultados',
    examples: ['Utilidades de años anteriores sin distribuir'],
  },
  {
    code: '3610',
    name: 'Utilidad del ejercicio',
    description: 'Ganancia o pérdida del año actual (resultado del período).',
    category: 'patrimonio',
    subcategory: 'resultados',
    examples: ['Utilidad del año en curso'],
    formula: 'Ingresos - Gastos = Utilidad (o Pérdida)',
  },
];

/**
 * Estructura completa del Balance General
 */
export const CHART_OF_ACCOUNTS = {
  activo: {
    corriente: ACTIVO_CORRIENTE,
    no_corriente: ACTIVO_NO_CORRIENTE,
  },
  pasivo: {
    corriente: PASIVO_CORRIENTE,
    no_corriente: PASIVO_NO_CORRIENTE,
  },
  patrimonio: PATRIMONIO,
};

/**
 * Obtener todas las cuentas en un array plano
 */
export const ALL_ACCOUNTS: AccountDefinition[] = [
  ...ACTIVO_CORRIENTE,
  ...ACTIVO_NO_CORRIENTE,
  ...PASIVO_CORRIENTE,
  ...PASIVO_NO_CORRIENTE,
  ...PATRIMONIO,
];

/**
 * Buscar cuenta por código
 */
export function getAccountByCode(code: string): AccountDefinition | undefined {
  return ALL_ACCOUNTS.find(account => account.code === code);
}

/**
 * Obtener cuentas por categoría
 */
export function getAccountsByCategory(category: 'activo' | 'pasivo' | 'patrimonio'): AccountDefinition[] {
  return ALL_ACCOUNTS.filter(account => account.category === category);
}

/**
 * Validación de la ecuación contable
 * ACTIVO = PASIVO + PATRIMONIO
 */
export interface BalanceValidation {
  isValid: boolean;
  totalActivo: number;
  totalPasivo: number;
  totalPatrimonio: number;
  difference: number;
  message: string;
}

export function validateAccountingEquation(
  activo: number,
  pasivo: number,
  patrimonio: number
): BalanceValidation {
  const difference = Math.abs(activo - (pasivo + patrimonio));
  const isValid = difference < 0.01; // Tolerancia de 1 centavo

  return {
    isValid,
    totalActivo: activo,
    totalPasivo: pasivo,
    totalPatrimonio: patrimonio,
    difference,
    message: isValid
      ? 'El balance está cuadrado ✓'
      : `El balance NO está cuadrado. Diferencia: $${difference.toFixed(2)}`,
  };
}
