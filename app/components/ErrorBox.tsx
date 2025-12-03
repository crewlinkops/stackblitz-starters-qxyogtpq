import { errorBoxStyle } from "../lib/styles";

interface ErrorBoxProps {
  message: string;
}

export function ErrorBox({ message }: ErrorBoxProps) {
  return <div style={errorBoxStyle}>{message}</div>;
}
