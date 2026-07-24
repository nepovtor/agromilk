import { Check, FileText, Sparkles, Wand2 } from "@/components/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ArticleTemplate } from "./article-editor.types";

const templates = [
  {
    key: "guide",
    label: "Рекомендация",
    icon: FileText,
    title: "Как подготовить рацион ...",
    excerpt: "Короткий разбор с нормами, частыми ошибками и финальной проверкой.",
    content:
      "<h2>TL;DR</h2><p>Коротко: ...</p><h2>Когда это нужно</h2><p>...</p><h2>Шаги</h2><ol><li>...</li><li>...</li><li>...</li></ol><h2>Частые ошибки</h2><ul><li>...</li><li>...</li></ul><h2>Финальная проверка</h2><p>...</p>",
  },
  {
    key: "checklist",
    label: "Полевой чек",
    icon: Check,
    title: "Чеклист: ...",
    excerpt: "Список быстрых проверок перед сезоном или поставкой.",
    content:
      "<h2>Перед стартом</h2><ul><li>...</li><li>...</li><li>...</li></ul><h2>Основной чек</h2><ol><li>...</li><li>...</li><li>...</li></ol><h2>Готово, если</h2><p>...</p>",
  },
  {
    key: "fix",
    label: "Симптом -> решение",
    icon: Wand2,
    title: "Что делать, если ...",
    excerpt: "Симптом, причина и практический путь к исправлению.",
    content:
      "<h2>Симптом</h2><p>...</p><h2>Почему так происходит</h2><p>...</p><h2>Быстрый фикс</h2><ol><li>...</li><li>...</li><li>...</li></ol><h2>Если не помогло</h2><p>...</p>",
  },
  {
    key: "faq",
    label: "Вопросы фермы",
    icon: Sparkles,
    title: "FAQ: ...",
    excerpt: "Ответы на вопросы, которые чаще всего возникают у хозяйств.",
    content:
      "<h2>Короткий ответ</h2><p>...</p><h2>Вопросы</h2><h3>...</h3><p>...</p><h3>...</h3><p>...</p><h3>...</h3><p>...</p><h2>Итог</h2><p>...</p>",
  },
] satisfies Array<ArticleTemplate & { key: string; label: string; icon: typeof FileText }>;

export function ArticleTemplates({ onApply }: { onApply: (template: ArticleTemplate) => void }) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-(--secondary) text-xs font-extrabold text-(--primary)">
            01
          </span>
          <div>
            <CardTitle>Быстрый старт</CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              Выберите основу или сразу начните с пустого материала.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="article-template-grid">
          {templates.map((template) => {
            const Icon = template.icon;
            return (
              <button
                type="button"
                key={template.key}
                className="group flex min-w-0 items-center gap-3 rounded-xl border border-(--border) bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/60 hover:shadow-sm"
                onClick={() => onApply(template)}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-600 transition group-hover:bg-white group-hover:text-(--primary)">
                  <Icon size={17} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-tight text-slate-800">
                    {template.label}
                  </span>
                  <span className="mt-1 block text-xs text-slate-400">Готовая структура</span>
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
