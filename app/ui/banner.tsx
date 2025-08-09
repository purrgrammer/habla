export default function Banner({
  src,
  negativeMargin = true,
}: {
  src?: string;
  negativeMargin?: boolean;
}) {
  return (
    <img
      className={`rounded-sm w-full max-h-[290px] bg-muted
      h-32
      xsm:h-38
      sm:h-64
      object-cover
      ${negativeMargin ? "-mb-20" : ""}`}
      src={src || "/family.png"}
    />
  );
}
