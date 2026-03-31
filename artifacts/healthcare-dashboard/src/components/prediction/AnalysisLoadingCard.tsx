import { Activity, Brain, FileSearch, ShieldAlert, type LucideIcon } from "lucide-react";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export const ANALYSIS_STEPS = [
  {
    title: "Validating clinical inputs",
    description: "Checking vitals, symptoms, and risk history for missing or conflicting values.",
    icon: FileSearch,
  },
  {
    title: "Running trained risk models",
    description: "Evaluating vitals against learned coefficients and checking dataset-aligned symptom patterns.",
    icon: Brain,
  },
  {
    title: "Checking red-flag clusters",
    description: "Escalating for emergency combinations like chest pain, severe blood pressure, or neurologic symptoms.",
    icon: ShieldAlert,
  },
  {
    title: "Composing care guidance",
    description: "Ranking likely conditions, surfacing top model signals, and preparing triage recommendations.",
    icon: Activity,
  },
] as const;

export function AnalysisLoadingCard({
  className,
  currentStep = 0,
  title = "AI analysis in progress",
  description = "Please wait while the engine normalizes inputs and computes the risk profile.",
}: {
  className?: string;
  currentStep?: number;
  title?: string;
  description?: string;
}) {
  return (
    <div
      className={cn(
        "premium-card min-h-[420px] border-primary/15 bg-gradient-to-br from-white via-blue-50/60 to-cyan-50/70 p-6 shadow-lg shadow-primary/5",
        className,
      )}
    >
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Spinner className="size-7" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">{title}</h3>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="space-y-4">
        {ANALYSIS_STEPS.map((step, index) => {
          const Icon = step.icon as LucideIcon;
          const isComplete = index < currentStep;
          const isActive = index === currentStep;

          return (
            <div
              key={step.title}
              className={cn(
                "rounded-2xl border p-4 transition-all duration-300",
                isActive
                  ? "border-primary/40 bg-white shadow-md shadow-primary/10"
                  : isComplete
                    ? "border-emerald-200 bg-emerald-50/80"
                    : "border-border/70 bg-white/70",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isComplete
                        ? "bg-emerald-500 text-white"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{step.title}</p>
                    {isActive ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                        Running
                      </span>
                    ) : null}
                    {isComplete ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                        Complete
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
