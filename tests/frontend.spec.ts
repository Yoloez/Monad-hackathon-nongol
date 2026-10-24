import { expect, test, type Page } from "@playwright/test";

const testAddress = "0x1111111111111111111111111111111111111111";

async function installTestWallet(page: Page, rejectFirst = false) {
  await page.addInitScript(
    ({ account, reject }) => {
      const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
      const requests: string[] = [];
      let connected = false;
      let chainId = "0x279f"; // Monad Testnet (10143)
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

test("full attendee flow: commit 1 MON and view digital ticket", async ({
  page,
}) => {
  await installTestWallet(page, false);
  await page.goto("/");

  // Connect wallet
  await page.getByRole("button", { name: "Connect Wallet", exact: true }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: /Wallet browser/ }).click();
  await expect(dialog).not.toBeVisible();

  // Button should now show "Kunci 1 MON"
  const commitButton = page.getByRole("button", { name: "Kunci 1 MON" });
  await expect(commitButton).toBeVisible();
  await commitButton.click();

  // Should transition to success and show "Lihat Tiket Saya"
  await expect(page.getByText("Kamu sudah terdaftar!", { exact: false })).toBeVisible({ timeout: 5000 });
  const viewTicketLink = page.getByRole("link", { name: "Lihat Tiket Saya" });
  await expect(viewTicketLink).toBeVisible();
  await viewTicketLink.click();

  // Ticket page should display confirmed ticket
  await expect(page).toHaveURL("/ticket");
  await expect(page.getByRole("article", { name: "Tiket registrasi terkonfirmasi" })).toBeVisible();
  await expect(page.getByText("REGISTRASI TERKONFIRMASI")).toBeVisible();
  await expect(page.getByRole("article", { name: "Tiket registrasi terkonfirmasi" }).getByText("1 MON")).toBeVisible();
});

test("full organizer flow: live statistics, participant lookup, check-in, and no-show settlement", async ({
  page,
}) => {
  await page.goto("/organizer");

  // Check live statistics are rendered
  await expect(page.getByText("Total Registered")).toBeVisible();
  await expect(page.getByText("Total Checked-in")).toBeVisible();
  await expect(page.getByText("Total No-Show")).toBeVisible();

  // Test participant lookup with sample attendee
  const sampleAttendee = "0x3a4b7f920831c2d9e15f48b94091a13e2f5b6c81";
  await page.getByLabel("Alamat wallet peserta atau data QR").fill(sampleAttendee);
  await page.getByRole("button", { name: "Cari Peserta" }).click();

  await expect(page.getByText("Ditemukan registrasi untuk")).toBeVisible();
  await expect(page.getByRole("button", { name: /Confirm Check-in/ })).toBeEnabled();

  // Confirm check-in
  await page.getByRole("button", { name: /Confirm Check-in/ }).click();
  await expect(page.getByText("Check-in berhasil!", { exact: false })).toBeVisible({ timeout: 5000 });
  await expect(page.getByText("1 MON Refund Sukses")).toBeVisible();

  // Test timeline switch to closed deadline
  await page.getByRole("button", { name: "3. Deadline Lewat" }).click();
  await expect(page.getByText("No-Show (Pending)")).toBeVisible();

  // Settle No-Show button should be enabled
  const settleButton = page.getByRole("button", { name: /Settle No-Show/ }).first();
  await expect(settleButton).toBeEnabled();
  await settleButton.click();
  await expect(page.getByText("Settlement no-show berhasil!", { exact: false })).toBeVisible({ timeout: 5000 });
});
