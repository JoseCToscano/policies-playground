"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "~/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover"

export interface ComboboxItem {
    value: string
    label: string
    icon?: React.ReactNode
    description?: string
    signerType?: 'Ed25519' | 'Secp256r1'
}

interface ComboboxProps {
    items: ComboboxItem[]
    value: string
    onChange: (value: string) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyText?: string
    className?: string
    disabled?: boolean
}

export function Combobox({
    items,
    value,
    onChange,
    placeholder = "Select an option...",
    searchPlaceholder = "Search...",
    emptyText = "No results found.",
    className,
    disabled = false,
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const triggerRef = React.useRef<HTMLButtonElement>(null)
    const [triggerWidth, setTriggerWidth] = React.useState<number | null>(null)

    // Update width when the trigger element resizes or when opened
    React.useEffect(() => {
        if (triggerRef.current) {
            setTriggerWidth(triggerRef.current.offsetWidth)
        }

        const updateWidth = () => {
            if (triggerRef.current) {
                setTriggerWidth(triggerRef.current.offsetWidth)
            }
        }

        // Use ResizeObserver to detect size changes
        if (typeof ResizeObserver !== 'undefined' && triggerRef.current) {
            const observer = new ResizeObserver(updateWidth)
            observer.observe(triggerRef.current)
            return () => observer.disconnect()
        }

        // Fallback to window resize events
        window.addEventListener('resize', updateWidth)
        return () => window.removeEventListener('resize', updateWidth)
    }, [open])

    return (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
                <Button
                    ref={triggerRef}
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn("w-full justify-between", className)}
                >
                    {value ? (
                        <>
                            {items.find((item) => item.value === value)?.icon && (
                                <span className="mr-2">
                                    {items.find((item) => item.value === value)?.icon}
                                </span>
                            )}
                            {items.find((item) => item.value === value)?.label || value}
                        </>
                    ) : (
                        placeholder
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="p-0"
                align="start"
                side="bottom"
                style={{ width: triggerWidth ? `${triggerWidth}px` : undefined }}
            >
                <Command>
                    <CommandInput placeholder={searchPlaceholder} className="h-9" />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {items.map((item) => (
                                <CommandItem
                                    key={item.value}
                                    value={item.value}
                                    onSelect={(currentValue) => {
                                        onChange(currentValue === value ? "" : currentValue)
                                        setOpen(false)
                                    }}
                                >
                                    <div className="flex items-center">
                                        {item.icon && <span className="mr-2">{item.icon}</span>}
                                        <div>
                                            <div className="flex items-center">
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        value === item.value ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                <span>{item.label}</span>
                                            </div>
                                            {item.description && (
                                                <p className="text-xs text-muted-foreground">{item.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
} 