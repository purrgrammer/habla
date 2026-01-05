"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import { NostrConnectSigner, Helpers } from "applesauce-signers";
import { NostrConnectAccount } from "applesauce-accounts/accounts";
import { useAccountManager } from "applesauce-react/hooks";
import { generateSecretKey } from "nostr-tools/pure";
import { bytesToHex } from "@noble/hashes/utils";
import { Button } from "~/ui/button";
import { Input } from "~/ui/input";
import { Label } from "~/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/ui/tabs";
import { AGGREGATOR_RELAYS } from "~/const";
import { toast } from "sonner";
import { Loader2, Copy, Check } from "lucide-react";
import pool from "~/services/relay-pool";

export default function RemoteSignerLogin({
  onConnected,
}: {
  onConnected?: () => void;
}) {
  const accountManager = useAccountManager();
  const [bunkerUrl, setBunkerUrl] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Default relays for signaling
  const RELAYS = ["wss://relay.nsec.app", ...AGGREGATOR_RELAYS];

  // Adapter for applesauce-signers
  const signerPool = {
    subscription: (relays: string[], filters: any[]) => pool.req(relays, filters),
    publish: (relays: string[], event: any) => pool.publish(relays, event),
  };

  // Handle Bunker URL Connection
  async function handleConnectBunker() {
    if (!bunkerUrl) return;

    setIsConnecting(true);
    try {
      const parsed = Helpers.parseBunkerURI(bunkerUrl);
      
      const signer = new NostrConnectSigner({
        relays: parsed.relays.length > 0 ? parsed.relays : RELAYS,
        remote: parsed.remote,
        secret: parsed.secret,
        pool: signerPool,
      });

      await signer.connect();
      
      const pubkey = await signer.getPublicKey();
      // Cast signer to any to avoid dual-package type mismatch
      const account = new NostrConnectAccount(pubkey, signer as any);
      
      accountManager.addAccount(account);
      accountManager.setActive(account);
      toast.success("Connected to remote signer!");
      onConnected?.();
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect to bunker: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsConnecting(false);
    }
  }

  return (
    <div className="grid gap-4 py-4">
      <Tabs defaultValue="bunker" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bunker">Bunker URL</TabsTrigger>
          <TabsTrigger value="qr">Scan QR</TabsTrigger>
        </TabsList>
        
        <TabsContent value="bunker" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bunker-url">Nostr Connect URI</Label>
            <Input
              id="bunker-url"
              placeholder="bunker://..."
              value={bunkerUrl}
              onChange={(e) => setBunkerUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Paste your NIP-46 connection string (bunker://) here.
            </p>
          </div>
          <Button 
            className="w-full" 
            onClick={handleConnectBunker} 
            disabled={isConnecting || !bunkerUrl}
          >
            {isConnecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Connect
          </Button>
        </TabsContent>
        
        <TabsContent value="qr">
            <QRCodeFlow 
                relays={RELAYS} 
                onConnected={onConnected}
            />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QRCodeFlow({ relays, onConnected }: { relays: string[], onConnected?: () => void }) {
    const accountManager = useAccountManager();
    const initialized = useRef(false);
    const [uri, setUri] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const secret = bytesToHex(generateSecretKey());
        const signer = new NostrConnectSigner({
            relays,
            secret,
            pool: {
                subscription: (relays: string[], filters: any[]) => pool.req(relays, filters),
                publish: (relays: string[], event: any) => pool.publish(relays, event),
            },
        });

        const generatedUri = Helpers.createNostrConnectURI({
            client: signer.clientPubkey,
            secret,
            relays,
            metadata: {
                name: "Habla",
                url: window.location.origin,
            },
        });
        
        setUri(generatedUri);

        let aborted = false;

        async function wait() {
             try {
                await signer.waitForSigner();
                if (aborted) return;

                const pubkey = await signer.getPublicKey();
                // Cast signer to any to avoid dual-package type mismatch
                const account = new NostrConnectAccount(pubkey, signer as any);

                accountManager.addAccount(account);
                accountManager.setActive(account);
                toast.success("Connected via QR Code!");
                onConnected?.();
            } catch (err) {
                if (!aborted) {
                    console.error("QR Connection failed", err);
                }
            }
        }
        wait();

        return () => {
            aborted = true;
            signer.close().catch(() => {});
        };
    }, [relays, onConnected, accountManager]);

    function copyToClipboard() {
        navigator.clipboard.writeText(uri);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    if (!uri) {
         return (
             <div className="flex flex-col items-center py-8">
                 <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                 <p className="text-sm text-muted-foreground mt-2">Generating connection...</p>
            </div>
         );
    }

    return (
        <div className="flex flex-col items-center space-y-4 pt-4">
            <div className="bg-white p-4 rounded-lg">
                <QRCode value={uri} size={200} />
            </div>
            <div className="text-center space-y-2 w-full">
                <p className="text-sm text-muted-foreground">
                    Scan with your Nostr signer app (e.g. Amber, Nostur)
                </p>
                <div className="flex items-center gap-2">
                    <Input value={uri} readOnly className="text-xs font-mono" />
                    <Button size="icon" variant="outline" onClick={copyToClipboard}>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
