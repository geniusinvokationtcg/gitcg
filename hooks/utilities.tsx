'use client';

import { Backdrop } from "@/components/Backdrop";
import { DialogBox } from "@/components/DialogBox";
import { ReactNode, useRef, useState } from "react";

export function useCopiedPopUp () {
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const copiedPopUpTrigger = () => {
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2000);
  }

  return { showNotification, setShowNotification, copiedPopUpTrigger }
}

export function usePopUp () {
  const timeouts = useRef<any[]>([]);
  const clearAllTimeouts = () => {
    timeouts.current.forEach(timeout => clearTimeout(timeout));
    timeouts.current = [];
  }

  const [showPopUp, setShowPopUp] = useState<boolean>(false);
  const triggerPopUp = (timeout?: number) => {
    clearAllTimeouts();
    setShowPopUp(true);
    timeouts.current.push(setTimeout(() => setShowPopUp(false), timeout || 2000));
  }

  return [triggerPopUp, showPopUp, setShowPopUp, timeouts] as const;
}

export function useDialogBox () {
  interface BoxEntry {
    key: string | number
    children: ReactNode
  }
  
  const [boxes, setBoxes] = useState<BoxEntry[]>([])

  const openBox = (key: BoxEntry["key"], children: BoxEntry["children"]) => {
    if(boxes.find(box => box.key === key)) return;
    setBoxes(prev => [...prev, { key, children }])
  }
  const closeBox = (key: BoxEntry["key"]) => {
    setBoxes(prev => prev.filter(box => box.key !== key))
  }
  const closeAllBoxes = () => {
    setBoxes([])
  }

  const isBoxActive = (key: BoxEntry["key"]) => {
    return boxes.some(box => box.key === key)
  }
  const isBoxOnTop = (key: BoxEntry["key"]) => {
    return boxes.at(-1)?.key === key
  }

  const DialogBoxes = <>
    {boxes.map(box => <div key={box.key}>
      <Backdrop isOpen={true} triggerFn={() => closeBox(box.key)}/>
      <DialogBox isOpen={true}>
        {box.children}
      </DialogBox>
    </div>)}
  </>

  return { boxes, DialogBoxes, openBox, closeBox, closeAllBoxes, isBoxActive, isBoxOnTop }
}