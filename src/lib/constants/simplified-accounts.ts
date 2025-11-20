// src/lib/constants/simplified-accounts.ts
// Cuentas simplificadas para usuarios no financieros

export interface SimplifiedAccount {
  code: string;
  name: string;
  description: string;
  category: 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto';
  subcategory: string;
  examples?: string[];
}

// ============================================
// BALANCE GENERAL - Cuentas Simplificadas
// ============================================

export const ACTIVO_CORRIENTE_SIMPLE: SimplifiedAccount[] = [
  {
    code: '1105',
    name: 'Efectivo',
    description: 'Dinero en efectivo y cuentas bancarias disponibles para usar inmediatamente',
    category: 'activo',
    subcategory: 'Activo Corriente',
    examples: [
      'Dinero en caja',
      'Saldos en cuentas bancarias',
      'Dinero en cajas menores',
    ],
  },
  {
    code: '1305',
    name: 'Clientes por Cobrar',
    description: 'Dinero que te deben tus clientes por ventas realizadas',
    category: 'activo',
    subcategory: 'Activo Corriente',
    examples: [
      'Facturas pendientes de cobro',
      'Ventas a crédito',
      'Dinero que te deben clientes',
    ],
  },
  {
    code: '1435',
    name: 'Inventario de Productos',
    description: 'Productos que tienes para vender o materiales para producir',
    category: 'activo',
    subcategory: 'Activo Corriente',
    examples: [
      'Mercancía en bodega',
      'Productos terminados',
      'Materias primas',
    ],
  },
];

export const ACTIVO_NO_CORRIENTE_SIMPLE: SimplifiedAccount[] = [
  {
    code: '1504',
    name: 'Maquinaria y Equipo',
    description: 'Máquinas, equipos y herramientas que usas para operar tu negocio',
    category: 'activo',
    subcategory: 'Activo No Corriente',
    examples: [
      'Maquinaria industrial',
      'Equipos de producción',
      'Herramientas especializadas',
    ],
  },
  {
    code: '1520',
    name: 'Equipos de Oficina y Computación',
    description: 'Computadores, impresoras, muebles y equipos de oficina',
    category: 'activo',
    subcategory: 'Activo No Corriente',
    examples: [
      'Computadores y laptops',
      'Impresoras y escáneres',
      'Escritorios y sillas',
      'Software',
    ],
  },
  {
    code: '1540',
    name: 'Vehículos',
    description: 'Carros, motos y otros vehículos usados para el negocio',
    category: 'activo',
    subcategory: 'Activo No Corriente',
    examples: [
      'Vehículos de reparto',
      'Carros de la empresa',
      'Motos mensajeras',
    ],
  },
];

export const PASIVO_CORRIENTE_SIMPLE: SimplifiedAccount[] = [
  {
    code: '2205',
    name: 'Proveedores por Pagar',
    description: 'Dinero que le debes a tus proveedores por compras realizadas',
    category: 'pasivo',
    subcategory: 'Pasivo Corriente',
    examples: [
      'Facturas de proveedores pendientes',
      'Compras a crédito',
      'Deudas con proveedores',
    ],
  },
  {
    code: '2335',
    name: 'Salarios por Pagar',
    description: 'Sueldos y prestaciones que debes pagar a tus empleados',
    category: 'pasivo',
    subcategory: 'Pasivo Corriente',
    examples: [
      'Nómina del mes',
      'Prestaciones sociales',
      'Bonificaciones pendientes',
    ],
  },
  {
    code: '2408',
    name: 'Impuestos por Pagar',
    description: 'Impuestos que debes pagar al gobierno (IVA, renta, etc.)',
    category: 'pasivo',
    subcategory: 'Pasivo Corriente',
    examples: [
      'IVA por pagar',
      'Retenciones en la fuente',
      'Impuesto de renta',
    ],
  },
];

export const PASIVO_NO_CORRIENTE_SIMPLE: SimplifiedAccount[] = [
  {
    code: '2105',
    name: 'Préstamos Bancarios',
    description: 'Créditos y préstamos a largo plazo con bancos',
    category: 'pasivo',
    subcategory: 'Pasivo No Corriente',
    examples: [
      'Créditos bancarios',
      'Préstamos empresariales',
      'Leasing financiero',
    ],
  },
];

export const PATRIMONIO_SIMPLE: SimplifiedAccount[] = [
  {
    code: '3105',
    name: 'Capital',
    description: 'Dinero que tú y los socios han invertido en el negocio',
    category: 'patrimonio',
    subcategory: 'Patrimonio',
    examples: [
      'Inversión inicial',
      'Aportes de los socios',
      'Capital social',
    ],
  },
  {
    code: '3605',
    name: 'Utilidades Acumuladas',
    description: 'Ganancias de años anteriores que no se han repartido',
    category: 'patrimonio',
    subcategory: 'Patrimonio',
    examples: [
      'Ganancias de años pasados',
      'Reservas de utilidades',
      'Utilidades retenidas',
    ],
  },
  {
    code: '3705',
    name: 'Utilidad del Año',
    description: 'Ganancia o pérdida del año actual',
    category: 'patrimonio',
    subcategory: 'Patrimonio',
    examples: [
      'Ganancia del año en curso',
      'Utilidad neta del período',
      'Resultado del ejercicio',
    ],
  },
];

// ============================================
// ESTADO DE RESULTADOS - Cuentas Simplificadas
// ============================================

export const INGRESOS_OPERACIONALES: SimplifiedAccount[] = [
  {
    code: '4135',
    name: 'Ventas de Productos',
    description: 'Todo el dinero que entra por vender tus productos o servicios',
    category: 'ingreso',
    subcategory: 'Ingresos Operacionales',
    examples: [
      'Ventas de mercancía',
      'Servicios prestados',
      'Facturación del período',
    ],
  },
];

export const COSTOS_VENTAS: SimplifiedAccount[] = [
  {
    code: '6135',
    name: 'Costo de los Productos Vendidos',
    description: 'Lo que te costó comprar o producir los productos que vendiste',
    category: 'gasto',
    subcategory: 'Costos de Ventas',
    examples: [
      'Costo de mercancía vendida',
      'Materias primas usadas',
      'Costo de producción',
    ],
  },
];

export const GASTOS_OPERACIONALES: SimplifiedAccount[] = [
  {
    code: '5105',
    name: 'Gastos de Personal',
    description: 'Sueldos, prestaciones y todos los costos relacionados con empleados',
    category: 'gasto',
    subcategory: 'Gastos Operacionales',
    examples: [
      'Salarios y sueldos',
      'Prestaciones sociales',
      'Aportes a seguridad social',
      'Bonificaciones',
    ],
  },
  {
    code: '5120',
    name: 'Gastos de Arriendo',
    description: 'Alquiler de oficinas, locales, bodegas o equipos',
    category: 'gasto',
    subcategory: 'Gastos Operacionales',
    examples: [
      'Arriendo del local',
      'Alquiler de oficina',
      'Arrendamiento de bodega',
    ],
  },
  {
    code: '5135',
    name: 'Servicios Públicos',
    description: 'Luz, agua, gas, internet, teléfono',
    category: 'gasto',
    subcategory: 'Gastos Operacionales',
    examples: [
      'Energía eléctrica',
      'Agua y alcantarillado',
      'Internet y telefonía',
      'Gas',
    ],
  },
  {
    code: '5195',
    name: 'Gastos de Marketing y Publicidad',
    description: 'Dinero invertido en promocionar tu negocio',
    category: 'gasto',
    subcategory: 'Gastos Operacionales',
    examples: [
      'Publicidad en redes sociales',
      'Volantes y folletos',
      'Campañas publicitarias',
      'Marketing digital',
    ],
  },
  {
    code: '5205',
    name: 'Otros Gastos Operacionales',
    description: 'Otros gastos necesarios para operar el negocio',
    category: 'gasto',
    subcategory: 'Gastos Operacionales',
    examples: [
      'Papelería y útiles',
      'Mantenimiento y reparaciones',
      'Seguros',
      'Transporte',
    ],
  },
];

export const GASTOS_NO_OPERACIONALES: SimplifiedAccount[] = [
  {
    code: '5305',
    name: 'Gastos Financieros',
    description: 'Intereses de préstamos, comisiones bancarias y otros costos financieros',
    category: 'gasto',
    subcategory: 'Gastos No Operacionales',
    examples: [
      'Intereses de préstamos',
      'Comisiones bancarias',
      'Gastos bancarios',
    ],
  },
];

export const INGRESOS_NO_OPERACIONALES: SimplifiedAccount[] = [
  {
    code: '4295',
    name: 'Otros Ingresos',
    description: 'Ingresos que no vienen de tu actividad principal',
    category: 'ingreso',
    subcategory: 'Ingresos No Operacionales',
    examples: [
      'Intereses ganados',
      'Arrendamientos',
      'Venta de activos',
    ],
  },
];

// ============================================
// Funciones de validación
// ============================================

export interface IncomeStatementValidation {
  utilidadBruta: number;
  utilidadOperacional: number;
  utilidadAntesImpuestos: number;
  utilidadNeta: number;
  margenBruto: number;
  margenOperacional: number;
  margenNeto: number;
}

export function calculateIncomeStatement(accounts: Record<string, number>): IncomeStatementValidation {
  // Ingresos
  const ingresos = INGRESOS_OPERACIONALES.reduce((sum, acc) => sum + (accounts[acc.code] || 0), 0);

  // Costos
  const costos = COSTOS_VENTAS.reduce((sum, acc) => sum + (accounts[acc.code] || 0), 0);

  // Utilidad Bruta
  const utilidadBruta = ingresos - costos;

  // Gastos Operacionales
  const gastosOperacionales = GASTOS_OPERACIONALES.reduce((sum, acc) => sum + (accounts[acc.code] || 0), 0);

  // Utilidad Operacional
  const utilidadOperacional = utilidadBruta - gastosOperacionales;

  // Ingresos y Gastos No Operacionales
  const ingresosNoOp = INGRESOS_NO_OPERACIONALES.reduce((sum, acc) => sum + (accounts[acc.code] || 0), 0);
  const gastosNoOp = GASTOS_NO_OPERACIONALES.reduce((sum, acc) => sum + (accounts[acc.code] || 0), 0);

  // Utilidad Antes de Impuestos
  const utilidadAntesImpuestos = utilidadOperacional + ingresosNoOp - gastosNoOp;

  // Utilidad Neta (asumiendo 35% de impuestos)
  const impuestos = utilidadAntesImpuestos * 0.35;
  const utilidadNeta = utilidadAntesImpuestos - impuestos;

  // Márgenes
  const margenBruto = ingresos > 0 ? (utilidadBruta / ingresos) * 100 : 0;
  const margenOperacional = ingresos > 0 ? (utilidadOperacional / ingresos) * 100 : 0;
  const margenNeto = ingresos > 0 ? (utilidadNeta / ingresos) * 100 : 0;

  return {
    utilidadBruta,
    utilidadOperacional,
    utilidadAntesImpuestos,
    utilidadNeta,
    margenBruto,
    margenOperacional,
    margenNeto,
  };
}

export function getAccountByCode(code: string): SimplifiedAccount | undefined {
  const allAccounts = [
    ...ACTIVO_CORRIENTE_SIMPLE,
    ...ACTIVO_NO_CORRIENTE_SIMPLE,
    ...PASIVO_CORRIENTE_SIMPLE,
    ...PASIVO_NO_CORRIENTE_SIMPLE,
    ...PATRIMONIO_SIMPLE,
    ...INGRESOS_OPERACIONALES,
    ...COSTOS_VENTAS,
    ...GASTOS_OPERACIONALES,
    ...GASTOS_NO_OPERACIONALES,
    ...INGRESOS_NO_OPERACIONALES,
  ];

  return allAccounts.find(acc => acc.code === code);
}
