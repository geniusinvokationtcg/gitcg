'use client';

import { useState } from "react";

export function useCopiedPopUp () {
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const copiedPopUpTrigger = () => {
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2000);
  }

  return { showNotification, setShowNotification, copiedPopUpTrigger }
}

export function useShowPopUp () {
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const popUpTrigger = (timeout?: number) => {
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), timeout || 2000);
  }

  return { showNotification, setShowNotification, popUpTrigger }
}