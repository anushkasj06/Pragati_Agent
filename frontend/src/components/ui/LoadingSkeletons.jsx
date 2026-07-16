/**
 * LoadingSkeletons — shimmer placeholders for all major content areas.
 */

export function SkeletonLine({ className = "h-4 w-full" }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

export function SkeletonBox({ className = "h-20 w-full" }) {
  return <div className={`skeleton rounded-2xl ${className}`} />;
}

export function SkeletonCircle({ size = "w-12 h-12" }) {
  return <div className={`skeleton rounded-full flex-shrink-0 ${size}`} />;
}

export function DecisionCardSkeleton() {
  return (
    <div className="glass rounded-3xl p-6 shadow-card space-y-4">
      <div className="flex items-center justify-between">
        <SkeletonLine className="h-5 w-32" />
        <SkeletonLine className="h-7 w-24 rounded-full" />
      </div>
      <SkeletonLine className="h-14 w-40" />
      <div className="grid grid-cols-3 gap-4">
        <SkeletonBox className="h-20" />
        <SkeletonBox className="h-20" />
        <SkeletonBox className="h-20" />
      </div>
    </div>
  );
}

export function ReasoningCardSkeleton() {
  return (
    <div className="glass rounded-3xl p-6 shadow-card space-y-4">
      <SkeletonLine className="h-5 w-40" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-start gap-3">
          <SkeletonCircle size="w-8 h-8" />
          <div className="flex-1 space-y-2">
            <SkeletonLine className="h-4 w-32" />
            <SkeletonLine className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ImprovementCardSkeleton() {
  return (
    <div className="glass rounded-3xl p-6 shadow-card space-y-4">
      <SkeletonLine className="h-5 w-44" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3">
          <SkeletonCircle size="w-6 h-6" />
          <SkeletonLine className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="glass rounded-3xl p-6 space-y-4">
          <SkeletonLine className="h-5 w-32" />
          <div className="grid grid-cols-2 gap-4">
            <SkeletonBox className="h-14" />
            <SkeletonBox className="h-14" />
            <SkeletonBox className="h-14" />
            <SkeletonBox className="h-14" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EvaluationSkeleton() {
  return (
    <div className="space-y-6">
      <DecisionCardSkeleton />
      <ReasoningCardSkeleton />
      <ImprovementCardSkeleton />
    </div>
  );
}
