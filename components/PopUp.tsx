import { Transition } from '@headlessui/react'
import { CheckCircleIcon } from '@heroicons/react/24/outline'

export function SuccessNotification({
  show, text
}: {
  show: boolean;
  text: string;
}) {
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
      <div className="fixed inset-x-0 top-0 z-200 flex justify-center items-center
        w-fit mt-8 mx-auto py-2 px-4
        bg-white border border-gray-300 rounded-xl text-gray-900 shadow-md"
      >
        <CheckCircleIcon className="size-5 text-gray-900" aria-hidden="true" />
        <div className="ml-3 text-sm text-gray-900">{text}</div>
      </div>
    </Transition>
  )
}