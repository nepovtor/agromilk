import { useEffect, useState } from "react";
import type { StatisticsPoint, StatisticsSummary } from "@agromilk/shared";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Eye, Inbox, Users } from "@/components/icons";
import { api } from "@/api";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatShortDate } from "@/lib/utils";

const iso = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const formatTooltipDate = (value: unknown) =>
  formatShortDate(typeof value === "string" || typeof value === "number" ? String(value) : "");

export function DashboardPage() {
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - 29);
  const [from, setFrom] = useState(iso(start));
  const [to, setTo] = useState(iso(today));
  const [summary, setSummary] = useState<StatisticsSummary | null>(null);
  const [timeline, setTimeline] = useState<StatisticsPoint[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const rangeError =
    !from || !to || from > to ? "Дата начала должна быть раньше даты окончания" : "";
  useEffect(() => {
    if (!from || !to || from > to) return;
    Promise.all([api.statistics.summary(from, to), api.statistics.timeline(from, to)])
      .then(([s, t]) => {
        setSummary(s);
        setTimeline(t.items);
        setError("");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Не удалось загрузить статистику"))
      .finally(() => setLoading(false));
  }, [from, to]);
  const setPeriod = (days: number) => {
    const periodTo = new Date();
    const periodFrom = new Date();
    periodFrom.setDate(periodTo.getDate() - days + 1);
    setFrom(iso(periodFrom));
    setTo(iso(periodTo));
  };
  const cards = [
    {
      label: "Уникальные посетители",
      value: summary?.visitors,
      icon: Users,
      tone: "admin-stat-icon",
    },
    {
      label: "Просмотры страниц",
      value: summary?.pageViews,
      icon: Eye,
      tone: "admin-water-icon",
    },
    {
      label: "Полученные заявки",
      value: summary?.applications,
      icon: Inbox,
      tone: "admin-sun-icon",
    },
    {
      label: "Конверсия в заявку",
      value: summary ? `${summary.conversionRate}%` : undefined,
      icon: BarChart3,
      tone: "admin-earth-icon",
    },
  ];
  return (
    <AdminLayout>
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Обзор</h1>
          <p className="mt-1 text-slate-500">
            Основные показатели посещаемости, обращений и конверсии сайта.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap justify-end gap-2">
            {[7, 30, 90].map((days) => (
              <Button
                key={days}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPeriod(days)}
              >
                {days} дней
              </Button>
            ))}
          </div>
          <div className="admin-field-band flex gap-2 rounded-lg p-3">
            <label className="text-xs text-slate-500">
              С
              <input
                className="mt-1"
                type="date"
                max={to || iso(today)}
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label className="text-xs text-slate-500">
              По
              <input
                className="mt-1"
                type="date"
                min={from}
                max={iso(today)}
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
          </div>
        </div>
      </div>
      {(rangeError || error) && <p className="mb-4 text-red-600">{rangeError || error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-bold">{loading ? "…" : (value ?? "—")}</p>
              </div>
              <div className={`grid h-12 w-12 place-items-center rounded-lg ${tone}`}>
                <Icon />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Динамика за выбранный период</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {!loading && timeline.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-slate-500">
                За выбранный период данных пока нет
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatShortDate} />
                  <YAxis allowDecimals={false} />
                  <Tooltip labelFormatter={formatTooltipDate} />
                  <Line
                    type="monotone"
                    dataKey="visitors"
                    name="Посетители"
                    stroke="#0164b1"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="pageViews"
                    name="Просмотры"
                    stroke="#75a843"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="applications"
                    name="Заявки"
                    stroke="#2f7d32"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
