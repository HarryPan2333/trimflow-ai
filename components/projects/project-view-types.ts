import type { getConfirmedPending, getCommercialOpportunity, getDealStrategy, getStakeholderCoverage } from "./project-command-data";

export type ReturnTypeConfirmedPending = ReturnType<typeof getConfirmedPending>;
export type ReturnTypeDealStrategy = ReturnType<typeof getDealStrategy>;
export type ReturnTypeStakeholderCoverage = ReturnType<typeof getStakeholderCoverage>;
export type ReturnTypeCommercialOpportunity = ReturnType<typeof getCommercialOpportunity>;
