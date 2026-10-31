import { useState } from 'react';

/**
 * A quiet button for something that can't be undone. It asks in the page,
 * not in a browser dialog, and only when `ask` is set; otherwise it acts at once.
 */
export function ConfirmButton({
  label,
  question,
  yes,
  no = 'Cancel',
  ask = true,
  danger = false,
  disabled = false,
  onConfirm,
}: {
  label: string;
  question: string;
  yes: string;
  no?: string;
  ask?: boolean;
  danger?: boolean;
  disabled?: boolean;
  onConfirm: () => void;
}) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button type="button" className="text-btn quiet" disabled={disabled} onClick={() => (ask ? setAsking(true) : onConfirm())}>
        {label}
      </button>
    );
  }
  return (
    <span className="confirm-inline" role="alertdialog" aria-label={question}>
      <span className="confirm-q">{question}</span>
      <span className="row centered">
        <button type="button" className={`btn small${danger ? ' danger' : ' primary'}`} disabled={disabled} autoFocus onClick={onConfirm}>
          {yes}
        </button>
        <button type="button" className="btn small" onClick={() => setAsking(false)}>
          {no}
        </button>
      </span>
    </span>
  );
}
