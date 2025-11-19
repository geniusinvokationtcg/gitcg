import { PopUpType } from '@/utils/types';
import { Transition } from '@headlessui/react'
import { CheckCircleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { ReactNode } from 'react';

export function SuccessNotification({
  show, text, type = "success"
}: {
  show: boolean;
  text: string | ReactNode;
  type?: PopUpType;
}) {
  let icon = <CheckCircleIcon className="size-5 text-gray-900" aria-hidden="true" />
  switch(type) {
    case "info": icon = <InformationCircleIcon className="size-5 text-gray-900" aria-hidden="true" />
      break;
    case "error": icon = <XCircleIcon className="size-5 text-gray-900" aria-hidden="true" />
      break;
  }
  
  return (
    <Transition
      show={show}
      enter="transform ease-out duration-200 transition"
      enterFrom="translate-y-[-100%] opacity-0"
      enterTo="translate-y-0 opacity-100"
      leave="transition ease-in duration-200"
      leaveFrom="translate-y-0 opacity-100"
      leaveTo="translate-y-[-100%] opacity-0"
    >
      <div className="fixed inset-x-0 top-0 z-200 flex justify-center items-center mt-8 mx-8">
        <div className="w-fit bg-white border border-gray-300 rounded-xl text-gray-900 shadow-md flex justify-center items-center py-2 px-4">
          {icon}
          <div className="ml-3 text-sm text-gray-900">{text}</div>
        </div>
      </div>
    </Transition>
  )
}