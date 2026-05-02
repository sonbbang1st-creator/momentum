// src/app/_components/fortune-skeleton.tsx
export function FortuneSkeleton() {
  return (
    <section className="animate-pulse">
      <div className="rounded-[32px] bg-surface-soft px-(--spacing-xxl) py-(--spacing-xxl)">
        <div className="h-4 w-32 bg-hairline rounded" />
        <div className="mt-(--spacing-md) h-7 w-3/4 bg-hairline rounded" />
        <div className="mt-(--spacing-base) h-4 w-full bg-hairline rounded" />
        <div className="mt-2 h-4 w-2/3 bg-hairline rounded" />
      </div>
      <div className="mt-(--spacing-md) grid grid-cols-3 gap-(--spacing-md)">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-28 rounded-xl border border-hairline-soft bg-canvas" />
        ))}
      </div>
    </section>
  )
}
