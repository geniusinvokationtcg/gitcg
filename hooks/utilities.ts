'use client';

import { useRef, useState } from "react";

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