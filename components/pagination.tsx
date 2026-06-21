"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
}

export function Pagination({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize)
  const isFirstPage = currentPage === 1
  const isLastPage = currentPage >= totalPages

  const handlePrevious = () => {
    if (!isFirstPage) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (!isLastPage) {
      onPageChange(currentPage + 1)
    }
  }

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
      <div className="text-xs text-muted-foreground">
        Page <span className="font-semibold">{currentPage}</span> of{" "}
        <span className="font-semibold">{totalPages}</span>
        {totalItems > 0 && (
          <>
            {" "}
            • <span className="font-semibold">{totalItems}</span> total items
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          onClick={handlePrevious}
          disabled={isFirstPage}
        >
          <ChevronLeft className="size-3" />
          Previous
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          onClick={handleNext}
          disabled={isLastPage}
        >
          Next
          <ChevronRight className="size-3" />
        </Button>
      </div>
    </div>
  )
}
