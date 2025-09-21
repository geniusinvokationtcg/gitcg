import { Button } from "@headlessui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { Dispatch, SetStateAction } from "react";

export function CustomButton({
  buttonText,
  onClick,
  textSize = "sm"
}: {
  buttonText: string;
  onClick?: () => void;
  textSize?: string;
}) {
  return <Button as="div"
    onClick={() => {if(onClick) onClick()}}
    className={`inline-flex justify-center items-center px-4 py-2 text-${textSize} bg-white border border-gray-300 rounded-sm text-gray-900
    hover:bg-gray-50 hover:border-gray-500 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 hover:shadow-md focus:shadow-md
    transition-all duration-200 ease-in-out
    bg-[right_0.5rem_center] bg-[length:1rem] bg-no-repeat
    cursor-pointer`}
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