import { DialogTrigger, type DialogProps } from "@radix-ui/react-dialog";
import { WalletConnect } from "applesauce-wallet-connect";
import { Wallet, RotateCcw, PlugZap, Unplug } from "lucide-react";
import { useState } from "react";
import { info } from "~/services/notifications";
import { Link } from "react-router";
import { useWallet } from "~/services/wallet";
import { Button } from "~/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/ui/dialog";
import { Input } from "~/ui/input";
import { Label } from "~/ui/label";

type ConnectionState = "idle" | "connecting" | "failed" | "connected";

export function ConnectWallet({ children }: DialogProps) {
  const [connectionString, setConnectionString] = useState("");
  const { wallet, setWallet } = useWallet();
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("idle");
  const [error, setError] = useState("");
  const isConnectionStringValid =
    connectionString &&
    connectionString.trim().startsWith("nostr+walletconnect://");
  const isConnecting = connectionState === "connecting";

  async function onConnect() {
    if (!isConnectionStringValid) return;

    setConnectionState("connecting");

    // smol delay
    setTimeout(() => {
      try {
        const wallet = WalletConnect.fromConnectURI(connectionString);
        setWallet(wallet);
        info("Wallet connected!");
      } catch (err) {
        console.error(err);
        setConnectionState("failed");
        if (err instanceof Error && err?.message) {
          setError(err.message);
        }
      }
    }, 300);
  }

  return (
    <Dialog modal>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect wallet</DialogTitle>
          <DialogDescription>
            Connect your wallet to with{" "}
            <Link
              target="_blank"
              to="https://nwc.dev"
              className="text-primary hover:underline hover:decoration-dotted"
            >
              NWC
            </Link>{" "}
            to make lightning fast payments
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-3">
            <Label htmlFor="conn">NWC connection string</Label>
            <div className="flex flex-col gap-1">
              <Input
                id="conn"
                onChange={(ev) => setConnectionString(ev.target.value)}
                type="password"
                name="connection"
                placeholder="nostr+walletconnect://.."
              />
              {connectionState === "idle" ? (
                <div className="flex flex-row items-center gap-1 px-1">
                  <PlugZap className="size-3 animate-pulse" />
                  <span className="text-xs text-muted-foreground">
                    Enter NWC string and click "Connect"
                  </span>
                </div>
              ) : connectionState === "connecting" ? (
                <div className="flex flex-row items-center gap-1 px-1">
                  <PlugZap className="size-3 animate-pulse" />
                  <span className="text-xs text-muted-foreground">
                    Connecting to your wallet...
                  </span>
                </div>
              ) : connectionState === "failed" ? (
                <div className="flex flex-row items-center gap-1 px-1 text-destructive">
                  <Unplug className="size-3 animate-pulse" />
                  <span className="text-xs line-clamp-1">
                    Failed to connect {error}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <DialogFooter>
          {wallet ? (
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          ) : (
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          )}
          <Button
            disabled={isConnecting || !isConnectionStringValid}
            onClick={onConnect}
          >
            {isConnecting ? (
              <RotateCcw className="animate-spin" />
            ) : (
              <PlugZap />
            )}
            Connect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
