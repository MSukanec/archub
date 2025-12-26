import type { DataHealthRule, DataHealthContext, DataHealthResult, DataIssue, DataSeverity } from '../types';
export class DataHealthEngine<TInput = unknown> {
  private rules: DataHealthRule<TInput>[] = [];
  constructor(rules: DataHealthRule<TInput>[] = []) {
    this.rules = rules;
  }
  registerRule(rule: DataHealthRule<TInput>): void {
    if (!this.rules.find(r => r.id === rule.id)) {
      this.rules.push(rule);
    }
  }
  registerRules(rules: DataHealthRule<TInput>[]): void {
    rules.forEach(rule => this.registerRule(rule));
  }
  getRules(filterTags?: string[]): DataHealthRule<TInput>[] {
    if (!filterTags || filterTags.length === 0) {
      return this.rules;
    }
    return this.rules.filter(rule => 
      rule.appliesTo.some(tag => filterTags.includes(tag))
    );
  }
  check(input: TInput[], ctx: DataHealthContext, filterTags?: string[]): DataHealthResult {
    const rulesToRun = this.getRules(filterTags);
    const issues: DataIssue[] = [];
    const bySeverity: Record<DataSeverity, number> = {
      info: 0,
      warning: 0,
      critical: 0,
    };
    for (const rule of rulesToRun) {
      try {
        const issue = rule.check(input, ctx);
        if (issue) {
          issues.push(issue);
          bySeverity[issue.severity]++;
        }
      } catch (error) {
        console.error(`DataHealthEngine: Error running rule ${rule.id}:`, error);
      }
    }
    issues.sort((a, b) => {
      const severityOrder: Record<DataSeverity, number> = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
    return {
      issues,
      stats: {
        totalRulesChecked: rulesToRun.length,
        issuesFound: issues.length,
        bySeverity,
      },
      checkedAt: new Date(),
    };
  }
}
export function createDataHealthEngine<TInput>(rules: DataHealthRule<TInput>[] = []): DataHealthEngine<TInput> {
  return new DataHealthEngine(rules);
}
