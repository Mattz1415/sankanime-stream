import React from 'react';

export function CardSkeleton() {
  return (
    <div className="rounded-2xl glass-card overflow-hidden flex flex-col">
      <div className="aspect-[3/4] w-full skeleton-shimmer" />
      <div className="p-3 space-y-2 bg-[#0e131d]">
        <div className="h-4 w-5/6 rounded-md skeleton-shimmer" />
        <div className="h-3 w-3/5 rounded-md skeleton-shimmer" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="w-full h-80 sm:h-96 rounded-3xl skeleton-shimmer mb-8 border border-white/5" />
  );
}
