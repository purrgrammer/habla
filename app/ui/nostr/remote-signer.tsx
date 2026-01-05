"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import QRCode from "react-qr-code";
import { NostrConnectSigner, Helpers } from "applesauce-signers";
import { NostrConnectAccount } from "applesauce-accounts/accounts";
import { useAccountManager } from "applesauce-react/hooks";
import { kinds } from "nostr-tools";
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
import { tap } from "rxjs";

export default function RemoteSignerLogin({
  onConnected,
}: {
  onConnected?: () => void;
}) {
  const accountManager = useAccountManager();
  const [bunkerUrl, setBunkerUrl] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Default relays for signaling
  const RELAYS = useMemo(() => ["wss://relay.nsec.app", ...AGGREGATOR_RELAYS], []);

  // Adapter for applesauce-signers
  const signerPool = useMemo(() => ({
    subscription: (relays: string[], filters: any[]) => {
        console.log("[RemoteSigner] Subscribing to", relays, filters);
        return pool.req(relays, filters).pipe(
            tap(ev => {
                if (typeof ev === "string") {
                    console.log("[RemoteSigner] Received control message:", ev);
                } else {
                    console.log("[RemoteSigner] Received Nostr event:", ev.kind, ev.id);
                }
            })
        );
    },
    publish: (relays: string[], event: any) => {
        console.log("[RemoteSigner] Publishing to", relays, event);
        return pool.publish(relays, event).then(res => {
            console.log("[RemoteSigner] Publish result:", res);
            return res;
        });
    },
  }), []);

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
    const [uri, setUri] = useState("");
    const [copied, setCopied] = useState(false);
    
    // Use refs to track state within async closures
    const finishedRef = useRef(false);
    const abortedRef = useRef(false);

    useEffect(() => {
        // Reset refs for this effect run
        finishedRef.current = false;
        abortedRef.current = false;

        const secret = bytesToHex(generateSecretKey());
        const signer = new NostrConnectSigner({
            relays,
            secret,
            pool: {
                subscription: (relays: string[], filters: any[]) => {
                    console.log("[RemoteSigner:QR] Subscribing to", relays, filters);
                    return pool.req(relays, filters).pipe(
                        tap(ev => {
                            if (typeof ev === "string") {
                                console.log("[RemoteSigner:QR] Received control message:", ev);
                            } else {
                                console.log("[RemoteSigner:QR] Received Nostr event:", ev.kind, ev.id);
                            }
                        })
                    );
                },
                publish: (relays: string[], event: any) => {
                    console.log("[RemoteSigner:QR] Publishing to", relays, event);
                    return pool.publish(relays, event).then(res => {
                        console.log("[RemoteSigner:QR] Publish result:", res);
                        return res;
                    });
                },
            },
        });

        const finish = async () => {
             if (finishedRef.current || abortedRef.current) {
                 console.log("[RemoteSigner:QR] finish() bailing. finished:", finishedRef.current, "aborted:", abortedRef.current);
                 return;
             }
             finishedRef.current = true;

             try {
                console.log("[RemoteSigner:QR] Finalizing connection...");
                
                // Fetch public key from remote signer
                console.log("[RemoteSigner:QR] Calling signer.getPublicKey()...");
                const pubkey = await signer.getPublicKey();
                console.log("[RemoteSigner:QR] Remote User Pubkey:", pubkey);
                
                if (abortedRef.current) {
                    console.log("[RemoteSigner:QR] Public key fetched but instance already aborted.");
                    return;
                }

                // Create account and set as active
                console.log("[RemoteSigner:QR] Creating NostrConnectAccount...");
                const account = new NostrConnectAccount(pubkey, signer as any);
                accountManager.addAccount(account);
                accountManager.setActive(account);
                
                console.log("[RemoteSigner:QR] Login successful. Calling onConnected()...");
                toast.success("Connected via QR Code!");
                onConnected?.();
            } catch (err) {
                console.error("[RemoteSigner:QR] Finalization failed", err);
                if (!abortedRef.current) {
                    finishedRef.current = false;
                    toast.error("Connection failed during setup: " + (err instanceof Error ? err.message : String(err)));
                }
            }
        };

        // Patch handleEvent for direct trigger
        const originalHandleEvent = signer.handleEvent.bind(signer);
        (signer as any).handleEvent = async (event: any) => {
            console.log("[RemoteSigner:QR] signer.handleEvent called for kind", event.kind);
            try {
                await originalHandleEvent(event);
                console.log("[RemoteSigner:QR] signer.handleEvent finished. isConnected:", signer.isConnected);
                if (signer.isConnected && !finishedRef.current && !abortedRef.current) {
                    console.log("[RemoteSigner:QR] isConnected is true! Triggering finish()...");
                    finish();
                }
            } catch (e) {
                console.error("[RemoteSigner:QR] signer.handleEvent error:", e);
            }
        };

        console.log("[RemoteSigner:QR] Client Pubkey:", signer.clientPubkey);

        // Start listening
        console.log("[RemoteSigner:QR] Opening signer connection...");
        signer.open();

        const generatedUri = Helpers.createNostrConnectURI({
            client: signer.clientPubkey,
            secret: signer.secret,
            relays,
            metadata: {
                name: "Habla",
                url: window.location.origin,
            },
        });
        
        console.log("[RemoteSigner:QR] Generated URI:", generatedUri);
        setUri(generatedUri);

        return () => {
            console.log("[RemoteSigner:QR] useEffect cleanup. Aborting instance...");
            abortedRef.current = true;
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