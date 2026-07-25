import type { ApplicationStatus } from "@agromilk/shared";

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  new: "Новая",
  viewed: "Просмотрена",
  in_progress: "В работе",
  completed: "Завершена",
  rejected: "Отклонена",
};

export const applicationStatusBadgeClass: Record<ApplicationStatus, string> = {
  new: "bg-[#e7f1fb] text-[#0164b1]",
  viewed: "bg-slate-100 text-slate-700",
  in_progress: "bg-amber-100 text-amber-800",
  completed: "bg-[#e8f5df] text-[#275a24]",
  rejected: "bg-red-100 text-red-800",
};
