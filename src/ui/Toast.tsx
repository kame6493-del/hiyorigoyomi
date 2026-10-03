export function Toast({ text }: { text: string }) {
  return (
    <div className={`toast ${text ? 'show' : ''}`} role="status" aria-live="polite">
      {text}
    </div>
  );
}
