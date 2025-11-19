export function Backdrop({
  isOpen,
  triggerFn
}: {
  isOpen: boolean
  triggerFn?: (...args: any[]) => any
}) {
  return <div
    className={`fixed inset-0 bg-[#00000050] z-100 transition-opacity duration-300 ${
      isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
    }`}
    onClick={triggerFn}
  />
}