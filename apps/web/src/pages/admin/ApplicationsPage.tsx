import { CheckCircle2, FileText } from "@/components/icons";
import { AdminLayout } from "@/components/AdminLayout";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { ApplicationDetailsPanel } from "@/features/applications/ApplicationDetailsPanel";
import { ApplicationFilters } from "@/features/applications/ApplicationFilters";
import { ApplicationTable } from "@/features/applications/ApplicationTable";
import { applicationStatusLabels } from "@/features/applications/application-status";
import { useApplications } from "@/hooks/useApplications";
import { useLocation, useParams } from "wouter";

export function ApplicationsPage() {
  const { id } = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const applications = useApplications({ applicationId: id, navigate });

  return (
    <AdminLayout>
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Заявки</h1>
          <p className="mt-1 text-slate-500">
            Запросы хозяйств на продукцию, консультации и поставки.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={applications.exporting}
          onClick={() => void applications.exportCsv()}
        >
          <FileText size={17} />
          {applications.exporting ? "Готовим файл…" : "Выгрузить CSV"}
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          <ApplicationFilters
            searchInput={applications.searchInput}
            status={applications.status}
            from={applications.from}
            to={applications.to}
            sort={applications.sort}
            hasActiveFilters={applications.hasActiveFilters}
            onSearchInputChange={applications.setSearchInput}
            onStatusChange={applications.setStatus}
            onFromChange={applications.setFrom}
            onToChange={applications.setTo}
            onSortChange={applications.setSort}
            onSubmit={applications.submitSearch}
            onReset={applications.resetFilters}
          />
          {applications.error && <p className="mb-4 text-sm text-red-600">{applications.error}</p>}
          {applications.selectedIds.size > 0 && (
            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3 sm:flex-row sm:items-center">
              <span className="text-sm font-semibold text-blue-900">
                Выбрано: {applications.selectedIds.size}
              </span>
              <Select
                className="sm:ml-auto sm:w-48"
                value={applications.bulkStatus}
                onChange={(event) =>
                  applications.setBulkStatus(event.target.value as typeof applications.bulkStatus)
                }
              >
                {Object.entries(applicationStatusLabels).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <Button
                size="sm"
                disabled={applications.bulkSaving}
                onClick={() => void applications.applyBulkStatus()}
              >
                <CheckCircle2 size={16} />
                {applications.bulkSaving ? "Обновляем…" : "Изменить статус"}
              </Button>
              <Button size="sm" variant="ghost" onClick={applications.clearSelection}>
                Отменить выбор
              </Button>
            </div>
          )}
          <ApplicationTable
            items={applications.data?.items ?? []}
            loading={applications.loading}
            selectedIds={applications.selectedIds}
            deletingId={applications.deletingId}
            onToggle={applications.toggleSelection}
            onToggleAll={applications.toggleVisibleSelection}
            onOpen={(applicationId) => void applications.open(applicationId)}
            onDelete={(application) => void applications.remove(application)}
          />
          <AdminPagination
            className="flex-col gap-3 sm:flex-row sm:items-center"
            page={applications.page}
            showPageIndicator
            totalItems={applications.data?.pagination.totalItems ?? 0}
            totalPages={applications.data?.pagination.totalPages ?? 1}
            onPageChange={applications.setPage}
          />
        </CardContent>
      </Card>
      {applications.selected && (
        <ApplicationDetailsPanel
          key={applications.selected.id}
          item={applications.selected}
          onClose={applications.closeDetails}
          onSave={(data) => applications.update(applications.selected!.id, data)}
          onDelete={applications.deleteSelected}
        />
      )}
    </AdminLayout>
  );
}
