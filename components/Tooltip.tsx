export function Tooltip({ children, content, position }: { children: React.ReactNode; content: React.ReactNode, position?: string }) {
  let positionCSS: string = ""
  switch(position){
    case "left":
      positionCSS = "right-full top-1/2 mr-2 -translate-y-1/2"
      break
    case "right":
      positionCSS = "left-full top-1/2 ml-2 -translate-y-1/2"
      break
    case "top":
      positionCSS = "left-1/2 bottom-full mb-2 -translate-x-1/2"
      break
    case "bottom":
    default:
      positionCSS = "left-1/2 top-full mt-2 -translate-x-1/2"
  }
  return (
    <div className="relative group inline-block">
      {children}
      <div className={`${positionCSS} absolute hidden rounded-sm bg-white border-1 border-gray-200 text-sm p-2 group-hover:block z-100`}>
        {content}
      </div>
    </div>
  )
}