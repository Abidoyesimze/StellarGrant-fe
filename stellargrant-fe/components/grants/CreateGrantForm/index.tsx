"use client";

import { FormProvider, useForm } from "react-hook-form";
import { Step2Milestones } from "./Step2Milestones";
import { TotalBudgetField } from "./TotalBudgetField";
import { defaultCreateGrantValues, type CreateGrantFormValues } from "./types";

/**
 * CreateGrantForm — step 2 (milestones) with live budget chart.
 * Steps 1+ are stubbed for future expansion.
 */
export function CreateGrantForm() {
  const methods = useForm<CreateGrantFormValues>({
    defaultValues: defaultCreateGrantValues,
    mode: "onChange",
  });

  return (
    <FormProvider {...methods}>
      <form className="max-w-2xl space-y-8">
        <TotalBudgetField />
        <Step2Milestones />
      </form>
    </FormProvider>
  );
}

export { Step2Milestones } from "./Step2Milestones";
export { BudgetDistributionChart } from "./BudgetDistributionChart";
