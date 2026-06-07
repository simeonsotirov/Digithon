import { defineWorkflow } from "openworkflow";

export const localDashboardPlaceholder = defineWorkflow(
  {
    name: "local-dashboard-placeholder",
  },
  async ({ step }) => {
    return step.run({ name: "dashboard-ready" }, () => ({ status: "ok" }));
  },
);
