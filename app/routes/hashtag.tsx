import Tag from "~/ui/tag";
import type { Route } from "./+types/hashtag";
import { buildBaseSeoTags } from "~/seo";
import ComingSoon from "~/ui/coming-soon";

export function meta({ params }: Route.MetaArgs) {
  const { tag } = params;
  return buildBaseSeoTags({
    title: `#${tag}`,
    description: `Explore the content tagged with #${tag}`,
    url: `https://habla.news/tag/${tag}`,
  });
}

export default function Hashtag({ params }: Route.MetaArgs) {
  const { tag } = params;
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-row gap-1 items-end">
        <span className="text-3xl font-light text-muted-foreground">#</span>
        <h1 className="text-4xl">{tag}</h1>
      </div>
      <ComingSoon />
    </div>
  );
}
