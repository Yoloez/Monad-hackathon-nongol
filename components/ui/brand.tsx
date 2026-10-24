import { Icon } from "./icon";

export function Brand() {
  return (
    <span className="brand">
      <span className="brand-symbol">
        <Icon name="check" size={23} strokeWidth={3.5} />
      </span>
      NONGOL
    </span>
  );
}

export function MonadMark() {
  return (
    <span className="monad">
      <span className="monad-mark" aria-hidden="true" />
      Monad
    </span>
  );
}
