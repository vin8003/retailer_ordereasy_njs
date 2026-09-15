import { channelPriceLines } from "@/lib/channelPrice";

interface ChannelPriceLinesProps {
  product: { price?: number | string | null; app_price?: number | string | null };
  align?: "left" | "right";
  storeClassName?: string;
}

/** Catalog/POS display: store list first; app only when it differs. */
export function ChannelPriceLines({
  product,
  align = "right",
  storeClassName = "font-bold",
}: ChannelPriceLinesProps) {
  const lines = channelPriceLines(product);
  const alignCls = align === "right" ? "text-right items-end" : "text-left items-start";
  return (
    <div className={`flex flex-col ${alignCls}`}>
      <div className={storeClassName}>
        ₹{lines.store}
        <span className="ml-1 text-[10px] font-semibold uppercase text-muted-foreground">
          Store
        </span>
      </div>
      {lines.app != null && (
        <div className="text-[10px] text-muted-foreground">App ₹{lines.app}</div>
      )}
    </div>
  );
}
