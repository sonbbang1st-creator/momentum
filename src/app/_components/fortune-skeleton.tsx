export function FortuneSkeleton() {
  return (
    <section className="animate-pulse">
      <div
        className="flex flex-col gap-3.5 rounded-[32px] p-7"
        style={{ background: '#F2F8F4' }}
      >
        <div className="h-3 w-20 rounded bg-hairline" />
        <div className="h-3 w-32 rounded bg-hairline" />
        <div className="mt-2 h-7 w-3/4 rounded bg-hairline" />
        <div className="h-7 w-2/3 rounded bg-hairline" />
        <div className="mt-2 h-3 w-full rounded bg-hairline" />
        <div className="h-3 w-5/6 rounded bg-hairline" />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2.5">
        <div className="h-32 rounded-[24px]" style={{ background: '#E8F4EC' }} />
        <div className="h-32 rounded-[24px]" style={{ background: '#EAF1F9' }} />
        <div className="h-32 rounded-[24px]" style={{ background: '#FBEDE2' }} />
      </div>
    </section>
  )
}
