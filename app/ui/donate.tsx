import {
  Link as LinkIcon,
  HandCoins,
  HandHeart,
  AtSign,
  Search,
} from "lucide-react";
import { Button } from "~/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/ui/card";
import ClientOnly from "~/ui/client-only";
import ZapDialog from "./nostr/zap.client";
import Logo from "~/ui/logo";
import { HABLA_PUBKEY } from "~/const";
import { useState } from "react";
import { Input } from "./input";
import { useActiveAccount } from "applesauce-react/hooks";
import { useProfile } from "~/hooks/nostr.client";
import Debug from "./debug";
import type { Pubkey } from "~/types";

function FeaturedYou() {
  return (
    <div className="flex flex-col gap-2 items-center justify-center">
      <img src="/favicon.ico" className="size-24 rounded-full object-cover" />
      <div className="flex flex-col gap-0 items-center justify-center">
        <h3 className="font-sans text-2xl line-clamp-1">You</h3>
        <div className="flex flex-row items-center gap-1">
          <Logo className="size-4 text-muted-foreground" />
          <h4 className="font-sans text-md line-clamp-1">username</h4>
        </div>
      </div>
    </div>
  );
}

function DonateUsername({
  pubkey,
  username,
  setUsername,
}: {
  pubkey: Pubkey;
  username: string;
  setUsername: (s: string) => void;
}) {
  const donateButton = (
    <Button className="w-full" size="lg">
      <HandCoins />
      Donate
    </Button>
  );
  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex flex-row items-center gap-2">
          <Logo className="size-7 text-muted-foreground" />
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="coolusername"
          />
        </div>
      </div>
      <ZapDialog pubkey={HABLA_PUBKEY} trigger={donateButton} />
    </>
  );
}

function DonateClient() {
  const account = useActiveAccount();
  const [username, setUsername] = useState("username");
  const donateButton = (
    <Button className="w-full" size="lg">
      <HandCoins />
      Donate
    </Button>
  );
  const features = [
    {
      icon: AtSign,
      text: `${username}@habla.news address`,
    },
    {
      icon: LinkIcon,
      text: `habla.news/${username} page`,
    },
    {
      icon: Search,
      text: "SEO for your content",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">
          <div className="flex flex-row items-center gap-1">
            <HandHeart className="size-6 text-muted-foreground" />
            Donate to Habla
          </div>{" "}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-md">
          Make a contribution to support the project and get{" "}
          <strong>featured on the home page</strong>.
        </p>
        {/*
        <ol className="pl-2">
          {features.map((f, index) => (
            <li className="flex flex-row items-center gap-1" key={index}>
              <f.icon className="text-muted-foreground size-4" />
              <span>{f.text}</span>
            </li>
          ))}
        </ol>
         */}
        <CardFooter>
          <ZapDialog pubkey={HABLA_PUBKEY} trigger={donateButton} />
        </CardFooter>
      </CardContent>
    </Card>
  );
}

export default function Donate() {
  const username = "username";
  const features = [
    {
      icon: AtSign,
      text: `${username}@habla.news address`,
    },
    {
      icon: LinkIcon,
      text: `habla.news/${username} page`,
    },
    {
      icon: Search,
      text: "SEO for your content",
    },
  ];

  const donateCard = (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">
          <div className="flex flex-row items-center gap-1">
            <HandHeart className="size-6 text-muted-foreground" />
            Donate to Habla
          </div>{" "}
        </CardTitle>

        <CardDescription></CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <p className="text-md">
          Make a contribution to support the project, get{" "}
          <strong>featured on the home page</strong>.
        </p>
        <ol className="pl-2">
          {features.map((f, index) => (
            <li className="flex flex-row items-center gap-1" key={index}>
              <f.icon className="text-muted-foreground size-4" />
              <span>{f.text}</span>
            </li>
          ))}
        </ol>
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  );
  return (
    <ClientOnly fallback={donateCard}>{() => <DonateClient />}</ClientOnly>
  );
}

export function DonateButton() {
  const [isDonating, setIsDonating] = useState(false);
  return (
    <ZapDialog
      open={isDonating}
      onOpenChange={setIsDonating}
      pubkey={HABLA_PUBKEY}
      trigger={
        <Button size="lg" className="w-full">
          <HandHeart />
          <span className="dark:text-foreground">Donate</span>
        </Button>
      }
    />
  );
}
