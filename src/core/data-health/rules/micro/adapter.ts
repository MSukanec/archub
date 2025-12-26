import type { DataHealthRule, DataIssue, DataHealthContext, CorrectiveAction } from '../../types';
import type { MicroRule, EntityLabels } from './types';

export interface FeatureRuleConfig<T> {
  ruleId: string;
  featureTag: string;
  microRule: MicroRule<T>;
  entityLabels: EntityLabels;
  formatTitle: (count: number, labels: EntityLabels) => string;
  formatDescription: (count: number, labels: EntityLabels) => string;
  getItemLabel: (item: T) => string;
  getRecommendedAction: (affectedIds: (string | number)[]) => CorrectiveAction;
}

export function createFeatureRule<T extends { id: string | number }>(
  config: FeatureRuleConfig<T>
): DataHealthRule<T> {
  const { 
    ruleId,
    featureTag, 
    microRule, 
    entityLabels, 
    formatTitle, 
    formatDescription, 
    getItemLabel, 
    getRecommendedAction 
  } = config;

  return {
    id: ruleId,
    name: formatTitle(1, entityLabels),
    description: formatDescription(1, entityLabels),
    category: microRule.config.category,
    appliesTo: [featureTag],
    check: (items: T[], ctx: DataHealthContext): DataIssue | null => {
      const result = microRule.check(items, ctx);
      
      if (result.isEmpty) return null;

      const count = result.affected.length;
      const affectedIds = result.affected.map(item => item.id);

      return {
        id: `${ctx.organizationId}-${ruleId}`,
        ruleId: ruleId,
        title: formatTitle(count, entityLabels),
        description: formatDescription(count, entityLabels),
        severity: microRule.config.severity,
        affectedCount: count,
        affectedEntities: result.affected.slice(0, 5).map(item => ({
          id: item.id,
          label: getItemLabel(item),
        })),
        recommendedAction: getRecommendedAction(affectedIds),
      };
    },
  };
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

export function createMissingClientDescription(count: number, labels: EntityLabels): string {
  const entity = count === 1 ? labels.singular : labels.plural;
  const estan = count > 1 ? 'están' : 'está';
  const registrados = count > 1 ? 'registrados' : 'registrado';
  
  return `${count} ${entity} de cliente ${estan} ${registrados} sin el cliente asignado. Esto significa que el sistema no sabe quién pagó o recibió el dinero.

**¿POR QUÉ IMPORTA?**
Sin cliente asignado, no puedes:
• Ver el historial de movimientos de cada cliente
• Generar reportes de ingresos/gastos por cliente
• Hacer seguimiento de deudas o pagos pendientes
• Conciliar facturas con pagos recibidos
• Analizar cuáles clientes son más rentables

**CÓMO ARREGLARLO:**
Edita cada movimiento y asigna el cliente correspondiente. Si no existe, crea un nuevo cliente primero.`;
}

export function createMissingProjectDescription(count: number, labels: EntityLabels): string {
  const entity = count === 1 ? labels.singular : labels.plural;
  const estan = count > 1 ? 'están' : 'está';
  const registrados = count > 1 ? 'registrados' : 'registrado';
  
  return `${count} ${entity} ${estan} ${registrados} sin proyecto asignado. El sistema no sabe a qué obra u proyecto corresponde el dinero.

**¿POR QUÉ IMPORTA?**
Sin proyecto asignado, no puedes:
• Ver los costos reales de cada proyecto (materiales, mano de obra, etc.)
• Comparar presupuesto vs. gasto en cada proyecto
• Identificar qué proyectos son más rentables
• Generar reportes de rentabilidad por proyecto
• Controlar el flujo de caja de cada obra

**CÓMO ARREGLARLO:**
Edita cada movimiento y asigna el proyecto correspondiente. Si el gasto es general (no asociado a un proyecto), considera crear una categoría separada.`;
}

export function createMissingWalletDescription(count: number, labels: EntityLabels): string {
  const entity = count === 1 ? labels.singular : labels.plural;
  const estan = count > 1 ? 'están' : 'está';
  const registrados = count > 1 ? 'registrados' : 'registrado';
  
  return `${count} ${entity} ${estan} ${registrados} sin billetera asignada. El sistema no sabe en qué cuenta o medio de pago se movió el dinero.

**¿POR QUÉ IMPORTA?**
Sin billetera asignada, no puedes:
• Ver el saldo real de cada cuenta (banco, efectivo, etc.)
• Reconciliar movimientos con tus estados bancarios
• Identificar pagos duplicados o inconsistencias
• Analizar cuál medio de pago usas más
• Generar reportes de flujo de caja por cuenta

**CÓMO ARREGLARLO:**
Edita cada movimiento y asigna la billetera (cuenta bancaria, caja de efectivo, etc.). Si necesitas crear una billetera nueva, hazlo en la sección de configuración.`;
}

export function createMissingPersonnelDescription(count: number, labels: EntityLabels): string {
  const entity = count === 1 ? labels.singular : labels.plural;
  const estan = count > 1 ? 'están' : 'está';
  const registrados = count > 1 ? 'registrados' : 'registrado';
  
  return `${count} ${entity} de personal ${estan} ${registrados} sin personal asignado. El sistema no sabe a quién se le realizó el pago.

**¿POR QUÉ IMPORTA?**
Sin personal asignado, no puedes:
• Ver el historial de pagos para cada miembro del equipo
• Generar reportes de costos de mano de obra por persona
• Hacer seguimiento de cuánto ganó cada empleado o subcontratista
• Analizar productividad y costos por persona
• Conciliar nóminas con los pagos registrados

**CÓMO ARREGLARLO:**
Edita cada movimiento y asigna el personal correspondiente. Si la persona no existe en tu lista de personal, primero agrégala a tu equipo de obra.`;
}

export function createExchangeRateDescription(count: number, labels: EntityLabels): string {
  const entity = count === 1 ? labels.singular : labels.plural;
  const estan = count > 1 ? 'están' : 'está';
  const registrados = count > 1 ? 'registrados' : 'registrado';
  const tiene = count > 1 ? 'tienen' : 'tiene';
  
  return `Tu organización usa múltiples monedas en los ajustes, pero ${count} ${entity} ${estan} ${registrados} en moneda extranjera y no ${tiene} cotización válida. Una cotización VÁLIDA debe ser un número mayor a 1 que represente el tipo de cambio real.

**¿POR QUÉ IMPORTA?**
Si la cotización es 1 (o falta), el sistema asumiría que 1 USD = 1 ARS, lo cual es incorrecto. Esto causa:
• Totales y balances incorrectos en reportes
• Análisis de rentabilidad distorsionado
• Decisiones financieras basadas en información falsa
• Problemas al reconciliar con tu contador

**¿QUÉ NÚMERO PONER?**
Siempre ingresa el tipo de cambio del día (por ejemplo: 1400). El sistema se encarga automáticamente de convertir los montos correctamente, sin importar cuál sea tu moneda base:

• Si tu moneda base es ARS y registras un movimiento en USD → pones 1400
• Si tu moneda base es USD y registras un movimiento en ARS → también pones 1400

No necesitas calcular nada diferente. El número es siempre el mismo tipo de cambio del mercado. El sistema sabe internamente si debe multiplicar o dividir según la dirección de la conversión.

**CÓMO ARREGLARLO:**
Edita cada movimiento y establece la cotización correcta (el tipo de cambio aplicado ese día).`;
}

