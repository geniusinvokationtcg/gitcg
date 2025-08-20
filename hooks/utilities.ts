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