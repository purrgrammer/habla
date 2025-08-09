export default function InlineEmoji({
  url,
  code,
}: {
  url: string;
  code: string;
}) {
  return <img src={url} alt={code} className="inline-block size-9" />;
}
