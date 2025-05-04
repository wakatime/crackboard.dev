import React, { useMemo } from 'react';

import {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from './pagination';

export type PaginationRowProps = {
  page: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
} & React.ComponentProps<typeof Pagination>;

export default function PaginationRow({ page: currentPage, totalPages, onPageChange, ...props }: PaginationRowProps) {
  const previousPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  const pages = useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 4) {
        pages.push('ellipsis');
      }

      let start = Math.max(2, currentPage - 2);
      let end = Math.min(totalPages - 1, currentPage + 2);

      if (start === 1 && totalPages >= 4) {
        end = 4;
      }

      if (end === totalPages && totalPages > 3) {
        start = totalPages - 3;
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end !== totalPages && currentPage < totalPages - 3) {
        pages.push('ellipsis');
      }

      pages.push(totalPages);
    }
    return pages;
  }, [currentPage, totalPages]);

  if (totalPages === 1) {
    return;
  }

  return (
    <Pagination {...props}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            disabled={previousPage === null}
            onClick={() => {
              if (previousPage) {
                onPageChange?.(previousPage);
              }
            }}
          />
        </PaginationItem>

        {pages.map((page, i) =>
          page === 'ellipsis' ? (
            <PaginationItem key={`${page}-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={`${page}-${i}`}>
              <PaginationButton isActive={page === currentPage} onClick={() => onPageChange?.(page)}>
                {page}
              </PaginationButton>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            disabled={!nextPage}
            onClick={() => {
              if (nextPage) {
                onPageChange?.(nextPage);
              }
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
