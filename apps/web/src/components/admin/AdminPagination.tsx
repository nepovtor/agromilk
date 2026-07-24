import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminPaginationProps = {
  className?: string;
  page: number;
  showPageIndicator?: boolean;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function AdminPagination({
  className,
  page,
  showPageIndicator = false,
  totalItems,
  totalPages,
  onPageChange,
}: AdminPaginationProps) {
  return (
    <div className={cn("mt-5 flex items-center justify-between", className)}>
      <span className="text-sm text-slate-500">Всего: {totalItems}</span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Назад
        </Button>
        {showPageIndicator && (
          <span className="text-sm">
            {page} / {totalPages}
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Далее
        </Button>
      </div>
    </div>
  );
}
