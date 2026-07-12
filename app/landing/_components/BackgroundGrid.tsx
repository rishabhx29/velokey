export default function BackgroundGrid() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.09]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #cfd6e2 1px, transparent 1px), linear-gradient(to bottom, #cfd6e2 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 85% 76% at 50% 18%, black 48%, transparent 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed left-1/2 top-0 z-0 h-[520px] w-[980px] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,216,214,0.18), rgba(0,216,214,0.06) 38%, transparent 72%)",
          filter: "blur(18px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-12%] top-[560px] z-0 h-[520px] w-[760px]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,90,95,0.16), rgba(255,90,95,0.07) 42%, transparent 72%)",
          filter: "blur(40px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-[760px] z-0 h-[520px] w-[820px]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(240,230,210,0.1), rgba(0,216,214,0.08) 36%, transparent 70%)",
          filter: "blur(46px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <span className="absolute left-[28%] top-[17%] h-20 w-20 bg-white/[0.045]" />
        <span className="absolute left-[68%] top-[35%] h-20 w-20 bg-white/[0.04]" />
        <span className="absolute left-[80%] top-[58%] h-20 w-20 bg-white/[0.035]" />
        <span className="absolute left-[42%] top-[72%] h-20 w-20 bg-white/[0.04]" />
      </div>
    </>
  );
}
