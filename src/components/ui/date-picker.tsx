import * as React from "react"
import { Button } from "@/components/ui/button"

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
}

export function DatePicker({ date, onDateChange, placeholder = "Pick a date" }: DatePickerProps) {
  return (
    <Button variant="outline" className="justify-start text-left font-normal">
      {date ? date.toLocaleDateString() : placeholder}
    </Button>
  )
}