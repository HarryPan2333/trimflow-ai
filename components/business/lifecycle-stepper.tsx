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

export function LifecycleStepper({ currentStage }: { currentStage: LifecycleStage }) {
  const currentIndex = lifecycleStages.findIndex((stage) => stage.id === currentStage);

  return (
    <div className="lifecycle-scroll" aria-label="业务生命周期">
      <ol className="lifecycle-stepper">
        {lifecycleStages.map((stage, index) => {
          const state = index < currentIndex ? "completed" : index === currentIndex ? "current" : "pending";
          return (
            <li className={`lifecycle-step lifecycle-${state}`} key={stage.id}>
              <span className="lifecycle-marker" aria-hidden="true">
                {state === "completed" ? "✓" : index + 1}
              </span>
              <span className="lifecycle-label" aria-current={state === "current" ? "step" : undefined}>
                {stage.label}
              </span>
              {index < lifecycleStages.length - 1 && <span className="lifecycle-connector">→</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
