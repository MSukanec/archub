// Temporary re-export for compatibility
// This file exports the new Estimates components from the estimates folder
// TODO: Remove this file once all imports are updated

export { default } from '../estimates/Estimates'
export { default as Tasks } from '../estimates/Estimates'
export { EstimateList as TaskList } from '../estimates/tabs/EstimateList'
export { EstimatePhases as TaskPhases } from '../estimates/tabs/EstimatePhases'
export { EstimateSchedule as TaskSchedule } from '../estimates/tabs/EstimateSchedule'