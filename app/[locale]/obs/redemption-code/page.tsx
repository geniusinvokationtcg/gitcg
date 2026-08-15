"use client";

export default function NextMatchOverlay() {
  const redemptionCode = "EHVESHCT861D"

  return <div style={{ width: 720 }} className="relative flex justify-center align-middle gap-4 items-center text-[30px] text-center h-40 prevent_select">
    <div className={`absolute z-1 genshin_font -top-0 text-[24px] italic transition-all duration-200`}>REDEMPTION CODE</div>
    <div className={`relative bg-[#fdca90] p-4 w-156 h-20 genshin_font rounded-[5rem] basic_shadow-bottom`}>
      <div className="tracking-widest">{redemptionCode}</div>
      <img src="/assets/dice-3d.png" className="absolute top-1/2 translate-y-[calc(-50%)] translate-x-[calc(-50%+28px)] transition-all duration-200" />
    </div>
  </div>
}