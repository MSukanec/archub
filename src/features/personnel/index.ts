// Export all services
export * from './services';
export * from './services/personnelPayments';

// Export all hooks
export * from './hooks';
export * from './hooks/use-personnel-payments';

// Export types
export * from './types';

// Export constants
export * from './constants';

// Export views
export { InsuranceView as PersonnelInsuranceView, InsuranceView as InsuranceTab } from './views/PersonnelInsuranceView';
export { default as PersonnelDashboardView, calculateAvailablePeriods, type PeriodFilter } from './views/PersonnelDashboardView';
export { default as PersonnelListView } from './views/PersonnelListView';
export { default as PersonnelAttendanceView } from './views/PersonnelAttendanceView';
export { default as PersonnelPaymentsView } from './views/PersonnelPaymentsView';

// Export components
export { InsuranceKpis } from './components/InsuranceKpis';
export { InsuranceGrid } from './components/InsuranceGrid';
export { InsuranceActions } from './components/InsuranceActions';

// Export modals
export { PersonnelAddModal } from './modals/PersonnelAddModal';
export { PersonnelDataModal } from './modals/PersonnelDataModal';
export { PersonnelAttendanceModal } from './modals/PersonnelAttendanceModal';
export { PersonnelRatesModal } from './modals/PersonnelRatesModal';
export { AdminLaborModal } from './modals/admin/AdminLaborModal';

// Export modals (nuevo patrón agnóstico)
export { PersonnelPaymentModal } from './modals/PersonnelPaymentModal';

// Export forms (patrón CONTACTS: FormPanel + ViewPanel + wrapper)
export { 
  FormPanel as PersonnelPaymentFormPanel,
  ViewPanel as PersonnelPaymentViewPanel,
  PersonnelPaymentFormFields 
} from './forms/PersonnelPaymentForm';

// Export utils
export { getPersonnelPaymentStatusBadgeConfig } from './utils/statusBadge';
