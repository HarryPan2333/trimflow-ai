import type { LifecycleStage } from "../../lib/mock-data";

const lifecycleStages: Array<{ id: LifecycleStage; label: string }> = [
  { id: "inquiry", label: "Inquiry" },
  { id: "requirement", label: "Requirement" },
  { id: "sample", label: "Sample" },
  { id: "quotation", label: "Quotation" },
  { id: "negotiation", label: "Negotiation" },
  { id: "po", label: "PO" },
  { id: "delivery", label: "Delivery" },
  { id: "shipment", label: "Shipment" },
];

export type LifecycleMilestone = {
  id: string;
  label: string;
  status: "completed" | "current" | "pending";
  date?: string;
  owner?: string;
};

export function LifecycleStepper({ currentStage, milestones }: { currentStage: LifecycleStage; milestones?: LifecycleMilestone[] }) {
  const currentIndex = lifecycleStages.findIndex((stage) => stage.id === currentStage);
  const items: LifecycleMilestone[] = milestones ?? lifecycleStages.map((stage, index) => ({
    ...stage,
    status: index < currentIndex ? "completed" : index === currentIndex ? "current" : "pending",
  }));

  return (
    <div className="lifecycle-scroll" aria-label="业务生命周期">
      <ol className="lifecycle-stepper">
        {items.map((stage, index) => {
          const state = stage.status;
          return (
            <li className={`lifecycle-step lifecycle-${state}`} key={stage.id}>
              <span className="lifecycle-marker" aria-hidden="true">
                {state === "completed" ? "✓" : index + 1}
              </span>
              <span className="lifecycle-label" aria-current={state === "current" ? "step" : undefined}>
                <strong>{stage.label}</strong>
                {(stage.date || stage.owner) && <small>{stage.date ?? "待确认"}{stage.owner ? ` · ${stage.owner}` : ""}</small>}
              </span>
              {index < items.length - 1 && <span className="lifecycle-connector">→</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
