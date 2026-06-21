import { useState, useCallback } from "react"

interface UsePaginationOptions {
  pageSize: number
  initialPage?: number
}

export function usePagination({ pageSize, initialPage = 1 }: UsePaginationOptions) {
  const [currentPage, setCurrentPage] = useState(initialPage)

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const getOffset = useCallback(() => {
    return (currentPage - 1) * pageSize
  }, [currentPage, pageSize])

  const reset = useCallback(() => {
    setCurrentPage(1)
  }, [])

  return {
    currentPage,
    pageSize,
    offset: getOffset(),
    onPageChange: handlePageChange,
    reset,
  }
}
