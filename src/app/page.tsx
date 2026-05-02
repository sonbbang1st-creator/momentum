export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-(--spacing-xl) text-center text-ink">
      <h1
        className="text-[28px] leading-[1.21] font-light text-ink-deep"
        style={{ fontFeatureSettings: '"ss01","ss02"' }}
      >
        MBTI 데일리 운세
      </h1>
      <p className="mt-(--spacing-base) text-[16px] leading-[1.5] text-ink">
        곧 오늘의 운세가 여기에 도착합니다.
      </p>
    </main>
  );
}
