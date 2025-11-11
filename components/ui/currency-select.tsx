"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { searchCurrencies, type Currency } from "@/lib/utils/currencies"

interface CurrencySelectProps {
    value: string
    onValueChange: (value: string) => void
    disabled?: boolean
    placeholder?: string
    className?: string
}

export function CurrencySelect({
    value,
    onValueChange,
    disabled = false,
    placeholder = "Search currencies...",
    className
}: CurrencySelectProps) {
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const filteredCurrencies = useMemo(() => {
        return searchCurrencies(searchQuery).slice(0, 20)
    }, [searchQuery])

    const selectedCurrency = useMemo(() => {
        return searchCurrencies("").find(currency => currency.code === value)
    }, [value])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }

        if (open) {
            document.addEventListener("mousedown", handleClickOutside)
            return () => document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [open])

    const handleSelect = (currency: Currency) => {
        onValueChange(currency.code)
        setOpen(false)
        setSearchQuery("")
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value)
        if (!open) setOpen(true)
    }

    const handleToggle = () => {
        if (disabled) return
        setOpen(!open)
        if (!open && inputRef.current) {
            inputRef.current.focus()
        }
    }

    const displayValue = selectedCurrency
        ? `${selectedCurrency.symbol} ${selectedCurrency.code} - ${selectedCurrency.name}`
        : ""

    return (
        <div ref={containerRef} className={cn("relative w-full", className)}>
            <div className="relative">
                <Input
                    ref={inputRef}
                    type="text"
                    value={open ? searchQuery : displayValue}
                    onChange={handleInputChange}
                    onFocus={() => setOpen(true)}
                    placeholder={selectedCurrency ? displayValue : placeholder}
                    disabled={disabled}
                    className="w-full pr-10"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={handleToggle}
                    disabled={disabled}
                >
                    <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
                </Button>
            </div>

            {open && (
                <div className="absolute top-full left-0 z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-[300px] overflow-auto">
                    {filteredCurrencies.length === 0 ? (
                        <div className="p-3 text-sm text-muted-foreground text-center">
                            No currencies found
                        </div>
                    ) : (
                        filteredCurrencies.map((currency) => (
                            <button
                                key={currency.code}
                                type="button"
                                className="w-full px-3 py-2 text-left hover:bg-muted/50 focus:bg-muted/50 focus:outline-none first:rounded-t-lg last:rounded-b-lg flex items-center justify-between"
                                onClick={() => handleSelect(currency)}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-sm font-medium w-8 text-center">
                                        {currency.symbol}
                                    </span>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">{currency.code}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {currency.name}
                                            {currency.country && ` • ${currency.country}`}
                                        </span>
                                    </div>
                                </div>
                                {value === currency.code && (
                                    <Check className="h-4 w-4 text-primary" />
                                )}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}