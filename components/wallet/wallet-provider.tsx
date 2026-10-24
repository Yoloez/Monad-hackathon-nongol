"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  useConnect,
  useConnection,
  useConnectors,
  useDisconnect,
  useSwitchChain,
  type Connector,
} from "wagmi";
import { monadTestnet } from "@/lib/web3/chains";
import { shortAddress } from "@/lib/nongol/view-models";
import { Icon } from "@/components/ui/icon";

const WalletContext = createContext<{ openWallet: () => void } | null>(null);
const subscribe = () => () => {};

export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function useWalletDialog() {
  const context = useContext(WalletContext);
  if (!context) throw new Error("WalletProvider is required");
  return context;
}

function walletErrorMessage(error: Error | null) {
  if (!error) return null;
  if (/UserRejected|denied|rejected/i.test(error.name + error.message))
    return "Permintaan dibatalkan di wallet. Kamu bisa mencoba lagi.";
  if (
    /ProviderNotFound|not found|not installed/i.test(error.name + error.message)
  )
    return "Wallet browser belum ditemukan. Buka melalui browser wallet atau pasang ekstensi wallet EVM.";
  return "Wallet belum berhasil merespons. Periksa wallet kamu, lalu coba lagi.";
}

function WalletOption({
  connector,
  pending,
  onSelect,
}: {
  connector: Connector;
  pending: boolean;
  onSelect: () => void;
}) {
  const [available, setAvailable] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    connector.getProvider().then(
      (provider) => {
        if (active) setAvailable(Boolean(provider));
      },
      () => {
        if (active) setAvailable(false);
      },
    );
    return () => {
      active = false;
    };
  }, [connector]);

  return (
    <button
      className="wallet-option"
      disabled={available !== true || pending}
      onClick={onSelect}
    >
      <span>
        <Icon name="wallet" />
        {connector.name === "Injected" ? "Wallet browser" : connector.name}
      </span>
      <small>
        {available === null
          ? "Mendeteksi…"
          : available
            ? "Hubungkan"
            : "Belum terdeteksi"}
      </small>
    </button>
  );
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { address, chainId, isConnected } = useConnection();
  const connectors = useConnectors();
  const connection = useConnect();
  const disconnection = useDisconnect();
  const switchNetwork = useSwitchChain();
  const wrongNetwork = isConnected && chainId !== monadTestnet.id;
  const errorMessage = walletErrorMessage(
    connection.error || switchNetwork.error || disconnection.error,
  );

  function openWallet() {
    connection.reset();
    switchNetwork.reset();
    disconnection.reset();
    dialogRef.current?.showModal();
  }

  return (
    <WalletContext value={{ openWallet }}>
      {children}
      <dialog
        ref={dialogRef}
        className="wallet-dialog"
        aria-labelledby="wallet-title"
        aria-describedby="wallet-description"
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current.close();
        }}
      >
        <div className="dialog-top">
          <span className="eyebrow">NONGOL × Monad Testnet</span>
          <button
            type="button"
            className="icon-button"
            aria-label="Tutup dialog wallet"
            onClick={() => dialogRef.current?.close()}
          >
            <Icon name="close" />
          </button>
        </div>
        <h2 id="wallet-title">
          {isConnected ? "Wallet kamu." : "Siap buat nongol?"}
        </h2>
        <p id="wallet-description">
          {isConnected
            ? "Koneksi wallet aktif. Registrasi event belum tersedia."
            : "Hubungkan wallet EVM kamu. Koneksi ini tidak mengirim dana atau meminta tanda tangan transaksi."}
        </p>
        {isConnected && address ? (
          <div className="connected-wallet">
            <span className="field-label">Alamat wallet</span>
            <code className="full-address">{address}</code>
            <span className={`badge ${wrongNetwork ? "warning" : "success"}`}>
              {wrongNetwork
                ? `Jaringan berbeda · ${chainId}`
                : "Monad Testnet · 10143"}
            </span>
            {wrongNetwork && (
              <button
                className="button primary full"
                disabled={switchNetwork.isPending}
                onClick={() =>
                  switchNetwork.mutate({ chainId: monadTestnet.id })
                }
              >
                {switchNetwork.isPending
                  ? "Konfirmasi di wallet…"
                  : "Pindah ke Monad Testnet"}
              </button>
            )}
            <button
              className="button secondary full"
              disabled={disconnection.isPending}
              onClick={() =>
                disconnection.mutate(
                  {},
                  { onSuccess: () => dialogRef.current?.close() },
                )
              }
            >
              <Icon name="logout" />
              {disconnection.isPending
                ? "Memutus koneksi…"
                : "Disconnect Wallet"}
            </button>
          </div>
        ) : (
          <div className="wallet-options">
            {connectors.map((connector) => (
              <WalletOption
                key={connector.uid}
                connector={connector}
                pending={connection.isPending}
                onSelect={() =>
                  connection.mutate(
                    { connector },
                    { onSuccess: () => dialogRef.current?.close() },
                  )
                }
              />
            ))}
            <p className="small muted">
              Belum punya wallet? Pasang ekstensi wallet EVM atau buka situs ini
              lewat browser wallet di ponsel.
            </p>
          </div>
        )}
        {connection.isPending && (
          <p role="status" className="inline-message">
            <Icon name="loader" className="spinner" />
            Konfirmasi koneksi di wallet kamu…
          </p>
        )}
        {errorMessage && (
          <p role="alert" className="inline-message error-message">
            {errorMessage}
          </p>
        )}
        <div className="dialog-note">
          <Icon name="shield" size={16} />
          Private key tetap berada di wallet kamu.
        </div>
      </dialog>
    </WalletContext>
  );
}

export function WalletButton({ organizer = false }: { organizer?: boolean }) {
  const hydrated = useHydrated();
  const { address, isConnected, isConnecting, isReconnecting } =
    useConnection();
  const { openWallet } = useWalletDialog();
  const pending = hydrated && (isConnecting || isReconnecting);
  return (
    <button
      type="button"
      className="button primary wallet-button"
      onClick={openWallet}
      disabled={!hydrated || pending}
    >
      <Icon
        name={pending ? "loader" : "wallet"}
        className={pending ? "spinner" : undefined}
        size={16}
      />
      {pending
        ? "Menghubungkan…"
        : hydrated && isConnected && address
          ? shortAddress(address)
          : organizer
            ? "Connect Organizer Wallet"
            : "Connect Wallet"}
    </button>
  );
}

export function NetworkGuard() {
  const hydrated = useHydrated();
  const { isConnected, chainId } = useConnection();
  const { mutate, isPending, error } = useSwitchChain();
  if (!hydrated || !isConnected || chainId === monadTestnet.id) return null;
  return (
    <div className="network-warning" role="status">
      <div className="container network-warning-inner">
        <div>
          <strong>Wallet kamu ada di jaringan lain.</strong>
          <p>Gunakan Monad Testnet (10143) untuk NONGOL.</p>
          {error && <p role="alert">{walletErrorMessage(error)}</p>}
        </div>
        <button
          className="button secondary"
          disabled={isPending}
          onClick={() => mutate({ chainId: monadTestnet.id })}
        >
          {isPending ? "Konfirmasi di wallet…" : "Pindah jaringan"}
          <Icon name="arrow-right" />
        </button>
      </div>
    </div>
  );
}
