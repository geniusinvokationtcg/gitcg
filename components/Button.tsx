import { Button } from "@headlessui/react";

export function CustomButton({
  buttonText,
  onClick
}: {
  buttonText: string;
  onClick?: () => void;
}) {
  return <Button as="div"
    onClick={() => {if(onClick) onClick()}}
    className="inline-flex justify-center items-center px-4 py-2 text-sm bg-white border border-gray-300 rounded-sm text-gray-900
    hover:bg-gray-50 hover:border-gray-500 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 hover:shadow-md focus:shadow-md
    transition-all duration-200 ease-in-out
    bg-[right_0.5rem_center] bg-[length:1rem] bg-no-repeat
    cursor-pointer"
  >
    {buttonText}
  </Button>
}