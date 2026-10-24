import { expect, test, type Page } from "@playwright/test";

// These are browser test fixtures only, never application/demo registrations.
const testAddress = "0x1111111111111111111111111111111111111111";

async function installTestWallet(page: Page, rejectFirst = false) {
  await page.addInitScript(
    ({ account, reject }) => {
      const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
      const requests: string[] = [];
      let connected = false;
      let chainId = "0x1";
      let shouldReject = reject;
      Object.defineProperty(window, "__walletRequests", { value: requests });
      Object.defineProperty(window, "ethereum", {
        value: {
          isMetaMask: true,
          on(event: string, callback: (...args: unknown[]) => void) {
            if (!listeners.has(event)) listeners.set(event, new Set());
            listeners.get(event)!.add(callback);
          },
          removeListener(
            event: string,
            callback: (...args: unknown[]) => void,
          ) {
            listeners.get(event)?.delete(callback);
          },
          async request({ method }: { method: string }) {
            requests.push(method);
            if (method === "eth_chainId") return chainId;
            if (method === "eth_accounts") return connected ? [account] : [];
            if (method === "eth_requestAccounts") {
              if (shouldReject) {
                shouldReject = false;
                throw Object.assign(new Error("User rejected request"), {
                  code: 4001,
                });
              }
              connected = true;
              return [account];
            }
            if (method === "wallet_switchEthereumChain") {
              chainId = "0x279f";
              listeners
                .get("chainChanged")
                ?.forEach((callback) => callback(chainId));
              return null;
            }
            if (method === "wallet_requestPermissions")
              return [{ parentCapability: "eth_accounts" }];
            if (method === "wallet_revokePermissions") {
              connected = false;
              return null;
            }
            throw new Error(`Unexpected test wallet request: ${method}`);
          },
        },
      });
    },
    { account: testAddress, reject: rejectFirst },
  );
}

test("three routes render without horizontal overflow or client errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const [route, heading] of [
    ["/", "Jangan cuma"],
    ["/ticket", "My Ticket"],
    ["/organizer", "Organizer"],
  ]) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      heading,
    );
    await expect(
      page.getByRole("navigation", { name: "Navigasi utama" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});

test("missing wallet and keyboard navigation have accessible feedback", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Langsung ke konten" })).toBeFocused();
  const opener = page.getByRole("button", { name: "Connect Wallet", exact: true });
  await opener.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Wallet browser/ })).toBeDisabled();
  await expect(dialog.getByText("Belum terdeteksi", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
});

test("registration stays unavailable and an unregistered wallet gets no real ticket", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Kunci 1 MON" }),
  ).toBeDisabled();
  await page.getByRole("link", { name: "My Ticket", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Belum Punya Tiket Nih." }),
  ).toBeVisible();
  await expect(
    page.getByRole("article", { name: "Tiket registrasi terkonfirmasi" }),
  ).toHaveCount(0);
  await page
    .getByText("Preview tampilan tiket · Demo", { exact: true })
    .click();
  await expect(
    page.getByText("DATA DEMO · Bukan registrasi on-chain.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("article", { name: "Contoh tiket, bukan tiket valid" }),
  ).toBeVisible();
  await page.getByLabel("Status tampilan demo").selectOption("loading");
  await expect(page.getByRole("status")).toContainText("Contoh loading");
  await page.getByLabel("Status tampilan demo").selectOption("error");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Contoh kegagalan");
  await page.getByRole("button", { name: "Coba lagi" }).click();
  await expect(
    page.getByText("DEMO · BUKAN TIKET VALID", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("article", { name: "Tiket registrasi terkonfirmasi" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Belum Punya Tiket Nih." }),
  ).toBeVisible();
});

test("organizer preview validates input and never enables contract actions", async ({
  page,
}) => {
  await page.goto("/organizer");
  await expect(page.getByLabel("Statistik event belum tersedia")).toBeVisible();
  await page.getByRole("button", { name: "Preview Organizer · Demo" }).click();
  await expect(
    page.getByText("DATA DEMO · Preview dashboard organizer.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Alamat wallet peserta").fill("invalid-wallet");
  await page.getByRole("button", { name: "Cari Peserta" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "alamat wallet EVM yang valid",
  );
  await page.getByLabel("Alamat wallet peserta").fill(testAddress);
  await page.getByRole("button", { name: "Cari Peserta" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "status registrasinya belum bisa diperiksa",
  );
  await expect(
    page.getByRole("button", { name: "Confirm Check-in" }),
  ).toBeDisabled();
  for (const button of await page
    .getByRole("button", { name: /Settle No-Show/ })
    .all())
    await expect(button).toBeDisabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("wallet rejection, connect, network switch and disconnect work without sending transactions", async ({
  page,
}) => {
  const clientErrors: string[] = [];
  page.on("pageerror", (error) => clientErrors.push(error.message));
  await installTestWallet(page, true);
  await page.goto("/ticket");
  await page
    .getByRole("button", { name: "Connect Wallet", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: /Wallet browser/ }).click();
  await expect(dialog.getByRole("alert")).toContainText(
    "Permintaan dibatalkan",
  );
  await dialog.getByRole("button", { name: /Wallet browser/ }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByText("Wallet kamu ada di jaringan lain.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Tiketmu belum bisa diperiksa." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Pindah jaringan", exact: true })
    .click();
  await expect(
    page.getByText("Wallet kamu ada di jaringan lain.", { exact: true }),
  ).not.toBeVisible();
  await page
    .getByRole("button", { name: /0x1111…1111/ })
    .first()
    .click();
  await expect(dialog.getByText(testAddress, { exact: true })).toBeVisible();
  await expect(
    dialog.getByText("Monad Testnet · 10143", { exact: true }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Disconnect Wallet" }).click();
  await expect(
    page.getByRole("heading", { name: "Belum Punya Tiket Nih." }),
  ).toBeVisible();
  const requests = await page.evaluate(
    () =>
      (window as unknown as { __walletRequests: string[] }).__walletRequests,
  );
  expect(requests).not.toContain("eth_sendTransaction");
  expect(requests).not.toContain("personal_sign");
  expect(clientErrors).toEqual([]);
});
