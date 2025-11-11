import { Button } from "@headlessui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { Dispatch, ReactNode, SetStateAction } from "react";
import { Checkmark } from "./Icons";

export function CustomButton({
  buttonText,
  onClick,
  textSize = "sm"
}: {
  buttonText: string;
  onClick?: (...args: any[]) => any
  textSize?: string;
}) {
  return <Button as="div"
    onClick={(e) => {if(onClick) onClick(e)}}
    className={`inline-flex justify-center items-center px-4 py-2 text-${textSize} bg-white border border-gray-300 rounded-sm text-gray-900
    hover:bg-gray-50 hover:border-gray-500 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 hover:shadow-md focus:shadow-md
    transition-all duration-200 ease-in-out
    bg-[right_0.5rem_center] bg-[length:1rem] bg-no-repeat
    cursor-pointer prevent_select`}
  >
    {buttonText}
  </Button>
}

export function IndexSelector ({
  currentIndex,
  setIndexFn,
  maxIndex,
  minIndex = 1,
  step = 1,
  className = "page_control px-3 pt-0.5"
}: {
  currentIndex: number
  setIndexFn: Dispatch<SetStateAction<number>>
  maxIndex: number
  minIndex?: number
  step?: number
  className?: string
}) {
  return <div className={className}>
    <ChevronLeftIcon className={currentIndex-step < minIndex ? "disabled" : ""} onClick={ () => {if(currentIndex-step >= minIndex) setIndexFn(i => i-step)} }/>
    <span>{`${currentIndex}/${maxIndex}`}</span>
    <ChevronRightIcon className={currentIndex+step > maxIndex ? "disabled" : ""} onClick={ () => {if(currentIndex+step <= maxIndex) setIndexFn(i => i+step)} }/>
  </div>
}

export function Checkbox ({
  children,
  className,
  trueCondition,
  onClick,
  checkboxSize = 4

}: {
  children: ReactNode
  className?: string
  trueCondition: boolean
  onClick: (...args: any[]) => any
  checkboxSize?: number
}) {
  return <div onClick={onClick} className={`hover:bg-gray-100 transition-colors duration-200 flex items-center w-full px-4 py-1.5 text-gray-700 cursor-pointer ${className}`}>
    <div className={`w-${checkboxSize} h-${checkboxSize} border rounded mr-3 flex items-center justify-center ${trueCondition ? 'bg-gray-600 border-gray-600' : 'border-gray-400'}`}>
      {trueCondition && <Checkmark className={`size-${checkboxSize} text-white`}/>}
    </div>
    {children}
  </div>
}