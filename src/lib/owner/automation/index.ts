/**
 * Automation module (Pillar 9)
 */

export { processAutomationEvent, seedAutomationRules } from './engine';
export { AUTOMATION_RULES, type AutomationRuleDefinition, type RuleSeverity } from './rules';
export * from './actions';
