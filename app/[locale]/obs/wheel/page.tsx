"use client";

import { useEffect, useRef, useState } from "react";
import "./style.css"
import useWheelNames from "./names";

export default function WheelOfFortuneOverlay() {
  const names: string = useWheelNames()
  const wheelItems = names.split(/\r?\n/).filter(name => !!name)
  //const wheelItems = ["Kerching", "DarkShrine", "Mischa", "Coffin", "Oldbie is coming", "leoric", "Silky <3", "Kojo", "TBlaze", "Linux", "Eon"]  

  const reversedItems = wheelItems.toReversed()

  const wheelRef = useRef<HTMLUListElement>(null)
  const [spinning, setSpinning] = useState(false)

  const rotationRef = useRef(0)

  const [showWinner, setShowWinner] = useState(false)
  const [winner, setWinner] = useState("")
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | undefined>()

  useEffect(() => {
    if(!showWinner) return;

    setTimeoutId(
      setTimeout(() => setShowWinner(false), 10000)
    )

  }, [showWinner])

  function spinWheel() {
    if(!wheelRef.current || spinning) return;

    setSpinning(true)

    const itemCount = wheelItems.length
    //const sliceAngle = 360 / itemCount

    const currentAngle = rotationRef.current % 360
    console.log("Current: ", currentAngle)

    const targetAngle = getTrueRandomInt(0, 720)
    console.log("Target: ", targetAngle)



    const spins = 20

    const newAngle = targetAngle - 360*spins
    console.log("New: ", newAngle)

    const animation = wheelRef.current.animate([
      { transform: `rotate(${currentAngle}deg)` },
      { transform: `rotate(${newAngle}deg)` }
    ],
    {
      duration: 8000,
      easing: "cubic-bezier(0.440, -0.055, 0.000, 1.000)",
      fill: "forwards"
    })

    rotationRef.current = targetAngle;

    animation.onfinish = () => {
      const selectedWinner = reversedItems[Math.floor((targetAngle % 360 /360) * itemCount)]
      setSpinning(false)
      setWinner(selectedWinner)
      setShowWinner(true)
      
      console.log("Check target: ", targetAngle)
      console.log("Winner: ", selectedWinner)
    }
  }

  return <fieldset className="ui-wheel-of-fortune" style={{ "--_items": wheelItems.length } as React.CSSProperties}>
    <ul ref={wheelRef}>
      {wheelItems.map((item, index) => <li key={index} style={{ "--_idx": index + 1 } as React.CSSProperties}>{item}</li>)}
    </ul>
    <button type="button" onClick={() => {
      clearTimeout(timeoutId)
      setShowWinner(false)
      spinWheel()
    }} disabled={spinning}></button>
    
    <div className={`${showWinner ? "opacity-100" : "opacity-0"} pointer-events-none transition-all duration-200 bg-[#fdca90] p-4 w-156 h-20 genshin_font text-3xl rounded-[5rem] basic_shadow-bottom`}>
      <div className="h-full flex items-center justify-center">{winner}</div>
    </div>
  </fieldset>
}

function getTrueRandomInt(min: number, max: number): number {
  const range = max - min + 1;
  const maxSafe = 256 - (256 % range);
  const array = new Uint32Array(1);

  // crypto.getRandomValues uses OS-level cryptographic entropy (CSPRNG)
  do {
    globalThis.crypto.getRandomValues(array);
  } while (array[0] >= maxSafe * Math.floor(232 / maxSafe)); // prevent bias

  return min + (array[0] % range);
}