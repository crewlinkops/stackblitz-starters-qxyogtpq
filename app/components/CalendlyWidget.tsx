"use client";

import { InlineWidget } from "react-calendly";

type CalendlyWidgetProps = {
  calendlyUrl: string;
  prefill?: {
    name?: string;
    email?: string;
  };
};

export default function CalendlyWidget({ calendlyUrl, prefill }: CalendlyWidgetProps) {
  return (
    <div style={{ minHeight: "700px" }}>
      <InlineWidget
        url={calendlyUrl}
        prefill={prefill}
        styles={{ height: "700px" }}
      />
    </div>
  );
}
