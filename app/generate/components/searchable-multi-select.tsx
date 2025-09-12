import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import Fuse from 'fuse.js'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, X, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface Option {
  id: string
  name: string
  value: string
}

interface SearchableMultiSelectProps {
  options: Option[]
  selected: string[]
  onSelectionChange: (selected: string[]) => void
  placeholder?: string
  maxDisplayed?: number
  isLoading?: boolean
  className?: string
}

export function SearchableMultiSelect({
  options,
  selected,
  onSelectionChange,
  placeholder = "Search and select...",
  maxDisplayed = 5,
  isLoading = false,
  className
}: SearchableMultiSelectProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Debounce search term
  useEffect(() => {
    setIsSearching(true)
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setIsSearching(false)
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Create Fuse instance for fuzzy search
  const fuse = useMemo(() => {
    if (options.length === 0) return null
    
    const fuseOptions = {
      keys: ['name', 'value'],
      threshold: 0.3,
      distance: 100,
      minMatchCharLength: 1,
      includeScore: true,
      ignoreLocation: true,
      findAllMatches: true
    }
    return new Fuse(options, fuseOptions)
  }, [options])

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return options.slice(0, maxDisplayed)
    }
    
    if (!fuse) return []
    
    const results = fuse.search(debouncedSearchTerm)
    return results.map(result => result.item).slice(0, maxDisplayed)
  }, [options, debouncedSearchTerm, fuse, maxDisplayed])

  // Handle option toggle
  const handleToggleOption = useCallback((optionValue: string) => {
    const newSelected = selected.includes(optionValue)
      ? selected.filter(item => item !== optionValue)
      : [...selected, optionValue]
    
    onSelectionChange(newSelected)
  }, [selected, onSelectionChange])

  // Handle removing a selected item
  const handleRemoveSelected = useCallback((optionValue: string) => {
    onSelectionChange(selected.filter(item => item !== optionValue))
  }, [selected, onSelectionChange])

  // Handle clear all
  const handleClearAll = useCallback(() => {
    onSelectionChange([])
  }, [onSelectionChange])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Get selected option names for display
  const selectedOptions = useMemo(() => {
    return options.filter(option => selected.includes(option.value))
  }, [options, selected])

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Selected items display */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedOptions.map(option => (
            <Badge
              key={option.id}
              variant="secondary"
              className="flex items-center gap-1 px-2 py-1"
            >
              {option.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 w-4 h-4 hover:bg-transparent"
                onClick={() => handleRemoveSelected(option.value)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          {selectedOptions.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={handleClearAll}
            >
              Clear all
            </Button>
          )}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className={`absolute left-3 top-3 h-4 w-4 ${isSearching ? 'text-blue-500 animate-pulse' : 'text-muted-foreground'}`} />
        <Input
          ref={inputRef}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={isLoading ? "Loading options..." : placeholder}
          disabled={isLoading}
          className="pl-10 pr-10"
        />
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1 h-8 w-8 p-0"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </Button>
      </div>

      {/* Dropdown */}
      {isOpen && !isLoading && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto bg-background border rounded-md shadow-lg">
          {filteredOptions.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              {debouncedSearchTerm.trim() ? 'No options found' : 'Start typing to search...'}
            </div>
          ) : (
            <div className="p-1">
              {filteredOptions.map(option => {
                const isSelected = selected.includes(option.value)
                return (
                  <div
                    key={option.id}
                    className={cn(
                      "flex items-center space-x-2 px-3 py-2 rounded-sm cursor-pointer hover:bg-muted/50 transition-colors",
                      isSelected && "bg-muted"
                    )}
                    onClick={() => handleToggleOption(option.value)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => {}} // Handled by parent click
                      className="pointer-events-none"
                    />
                    <span className="flex-1 text-sm">{option.name}</span>
                  </div>
                )
              })}
              
              {options.length > maxDisplayed && (
                <div className="px-3 py-2 text-xs text-muted-foreground border-t">
                  Showing {Math.min(filteredOptions.length, maxDisplayed)} of {options.length} options
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}