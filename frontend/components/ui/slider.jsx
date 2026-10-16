import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef(({ className, ...props }, ref) => {
  const [isDragging, setIsDragging] = React.useState(false);

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn("relative flex w-full touch-none select-none items-center", className)}
      onPointerDown={() => setIsDragging(true)}
      onPointerUp={() => setIsDragging(false)}
      {...props}>
      <SliderPrimitive.Track
        className={cn(
          "relative h-1.5 w-full grow overflow-hidden rounded-full transition-colors",
          isDragging ? "bg-green-200" : "bg-slate-200"
        )}>
        <SliderPrimitive.Range className={cn("absolute h-full transition-colors", isDragging ? "bg-green-500" : "bg-teal-500")} />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className={cn(
          "block h-5 w-5 rounded-full border-2 shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          isDragging
            ? "border-green-500 bg-green-400 focus-visible:ring-green-400"
            : "border-teal-500 bg-teal-500 focus-visible:ring-teal-400"
        )} />
    </SliderPrimitive.Root>
  );
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
