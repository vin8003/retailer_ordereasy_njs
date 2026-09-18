import { cn } from "@/lib/utils";
import { getOfdPodPhotoUrl, type OfdPodPhotoDisplay } from "@/utils/ofdPodPhoto";

/** Order-detail OFD proof-of-delivery thumb. Renders nothing when BE omitted `pod_photo_url`. */
export function OfdPodPhotoThumb({
    order,
    className,
}: {
    order: OfdPodPhotoDisplay;
    className?: string;
}) {
    const photoUrl = getOfdPodPhotoUrl(order);
    if (!photoUrl) return null;

    return (
        <div
            aria-label="Proof of delivery photo"
            className={cn("flex items-center gap-2", className)}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={photoUrl}
                alt="Proof of delivery"
                className="size-16 rounded-md object-cover border border-gray-100"
            />
            <span className="text-sm text-muted-foreground">Proof of delivery</span>
        </div>
    );
}
