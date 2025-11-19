import { Button } from "@headlessui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { Dispatch, ReactNode, SetStateAction } from "react";
import { Checkmark } from "./Icons";

export function CustomButton({
  buttonText,
  onClick,
  textSize = "sm",
  disabled = false
}: {
  buttonText: string;
  onClick?: (...args: any[]) => any
  textSize?: string;
  disabled?: boolean
}) {
  return <Button as="div"
    onClick={(e) => {if(onClick && !disabled) onClick(e)}}
    className={
      `inline-flex justify-center items-center px-4 py-2 text-${textSize} bg-white border rounded-sm 
      transition-all duration-200 ease-in-out
      ${disabled ? "border-gray-200 text-gray-400 pointer-events-none" : `
        border-gray-300 text-gray-900
        hover:bg-gray-50 hover:border-gray-500 hover:shadow-md
      `}
      cursor-pointer prevent_select`
    }
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
  checkboxSize = 4,
  disabled = false

}: {
  children: ReactNode
  className?: string
  trueCondition: boolean
  onClick: (...args: any[]) => any
  checkboxSize?: number
  disabled? : boolean
}) {
  return <div
    onClick={() => {if(!disabled) onClick()}}
    className={`transition-all duration-200 flex items-center w-full px-4 py-1.5 text-gray-700 ${disabled ? "opacity-50" : "cursor-pointer hover:bg-gray-100"} ${className}`}
  >
    <div className={`w-${checkboxSize} h-${checkboxSize} border rounded mr-3 flex items-center justify-center ${trueCondition ? 'bg-gray-600 border-gray-600' : 'border-gray-400'}`}>
      <Checkmark className={`size-${checkboxSize} text-white ${trueCondition ? "" : "opacity-0"}`}/>
    </div>
    {children}
  </div>
}

export function IconButton ({
  size = "24px",
  circleSizeMultiplier = 1.5,
  children,
  className = "",
  onClick
}: {
  size?: string
  circleSizeMultiplier?: number
  children: ReactNode
  className?: string
  onClick?: (...args: any[]) => any
}) {

  const iconStyle = {
    width: size,
    height: size
  }
  const circleStyle = {
    width: `calc(${size} * ${circleSizeMultiplier})`,
    height: `calc(${size} * ${circleSizeMultiplier})`
  }

  return <div className={className}>
    <div className="group relative" onClick={onClick}>
      <div style={circleStyle} className="absolute cursor-pointer rounded-[50%] group-hover:bg-[#e5e7eb] transition-colors duration-200 top-1/2 left-1/2 -translate-1/2"></div>
        <div style={iconStyle} className="absolute cursor-pointer">
          {children}
        </div>
      <div style={iconStyle}/>
    </div>
  </div>
}