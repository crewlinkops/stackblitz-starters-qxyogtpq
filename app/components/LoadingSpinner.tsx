import { loadingTextStyle } from "../lib/styles";

interface LoadingSpinnerProps {
  text?: string;
}

export function LoadingSpinner({ text = "Loading…" }: LoadingSpinnerProps) {
  return <p style={loadingTextStyle}>{text}</p>;
}
