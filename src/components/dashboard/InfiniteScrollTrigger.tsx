import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface InfiniteScrollTriggerProps {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export const InfiniteScrollTrigger: React.FC<InfiniteScrollTriggerProps> = ({
  onLoadMore,
  hasMore,
  isLoading,
}) => {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (triggerRef.current) {
      observer.observe(triggerRef.current);
    }

    return () => {
      if (triggerRef.current) {
        observer.unobserve(triggerRef.current);
      }
    };
  }, [hasMore, isLoading, onLoadMore]);

  if (!hasMore) return null;

  return (
    <div ref={triggerRef} className="py-8 flex justify-center w-full">
      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Loading more records...</span>
        </div>
      )}
    </div>
  );
};
