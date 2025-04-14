import { pagesRange } from '@acme/core/utils';
import {
  Pagination as PaginationRoot,
  PaginationButton,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNextButton,
  PaginationPreviousButton,
} from '@acme/ui/components/ui/pagination';
import { Fragment } from 'react';

interface Props {
  onClickPage: (page: number) => void;
  page: number;
  totalPages: number;
}

export default function Pagination({ page, totalPages, onClickPage }: Props) {
  const onClick = (p: number) => {
    onClickPage(p);
  };

  if (totalPages <= 1) {
    return null;
  }

  const pages = pagesRange(totalPages, page);

  return (
    <PaginationRoot>
      <PaginationContent>
        <PaginationItem>
          <PaginationPreviousButton disabled={page <= 1} onClick={() => onClick(page - 1)} />
        </PaginationItem>

        {pages.map((p, i) => {
          const last = i == pages.length - 1;
          if ((i == 0 && p > 1) || (last && p < totalPages)) {
            return (
              <Fragment key={`pagination-${totalPages}-${page}-${p}`}>
                {last ? (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : null}

                <PaginationItem>
                  <PaginationButton disabled={page <= 0} onClick={() => onClick(last ? totalPages : 1)}>
                    {last ? totalPages : 1}
                  </PaginationButton>
                </PaginationItem>
                {i == 0 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
              </Fragment>
            );
          } else {
            return (
              <PaginationItem key={`pagination-${totalPages}-${page}-${p}`}>
                <PaginationButton isActive={p == page} onClick={() => onClick(p)}>
                  {p}
                </PaginationButton>
              </PaginationItem>
            );
          }
        })}
        <PaginationItem>
          <PaginationNextButton disabled={page >= totalPages} onClick={() => onClick(page + 1)} />
        </PaginationItem>
      </PaginationContent>
    </PaginationRoot>
  );
}
