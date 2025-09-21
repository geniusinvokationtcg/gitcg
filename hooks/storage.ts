'use client'

import { useState, useEffect } from "react"

export function useLocalStorage<T>(key: string, initialValue: T){
  const [value, setValue] = useState<T>(() => {
    if(typeof window === "undefined") return initialValue
    try {
      const item = localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch (e) {
      console.error(e)
      return initialValue
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.error(e)
    }
  }, [key, value])

  return [value, setValue] as const
}