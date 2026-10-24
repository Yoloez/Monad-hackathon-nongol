import { Icon } from "./icon";

export function LoadingState({
  message = "Memuat data event…",
}: {
  message?: string;
}) {
  return (
    <div className="feedback-state" role="status">
      <Icon name="loader" className="spinner" size={25} />
      <h2>Sebentar, ya.</h2>
      <p>{message}</p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="feedback-state" role="alert">
      <span className="eyebrow warning-text">Ada kendala</span>
      <h2>Data belum berhasil dimuat.</h2>
      <p>{message}</p>
      {onRetry && (
        <button className="button secondary" onClick={onRetry}>
          Coba lagi
        </button>
      )}
    </div>
  );
}
