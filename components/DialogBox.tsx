'use client';

import { motion } from "framer-motion";
import { ReactNode } from "react";

export function DialogBox ({
  isOpen,
  children,
}: {
  isOpen: boolean
  children: ReactNode
}) {

  return <> 
    {isOpen && <motion.div
      initial={{
        opacity: 0,
        y: "5%"
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      exit={{
        opacity: 0,
        y: "5%"
      }}
      transition={{
        duration: 0.2,
        ease: "easeInOut"
      }}
      className="fixed z-101 m-auto left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
    >
      {children}
    </motion.div>}
  </>
}