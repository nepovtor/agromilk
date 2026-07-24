import type { ArticleStatus } from "@landing/shared";
import { Link, useLocation, useParams } from "wouter";
import {
  ArrowLeft,
  Check,
  Clipboard,
  Clock3,
  Eye,
  FileText,
  Loader2,
  RefreshCcw,
  Save,
  Trash2,
} from "@/components/icons";
import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ArticleContentEditor } from "@/features/articles/ArticleContentEditor";
import { ArticleCoverEditor } from "@/features/articles/ArticleCoverEditor";
import { ArticlePreview } from "@/features/articles/ArticlePreview";
import { ArticleTemplates } from "@/features/articles/ArticleTemplates";
import { articleStatusColors, articleStatusLabels } from "@/features/articles/article-editor.types";
import { useArticleEditor } from "@/hooks/useArticleEditor";
import { cn } from "@/lib/utils";

export function ArticleEditorPage() {
  const { id } = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const editor = useArticleEditor({ id, navigate });

  if (editor.loading) {
    return (
      <AdminLayout>
        <p>Загрузка...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-[1500px] pb-10">
        <Link
          href="/admin/articles"
          className="mb-4 inline-flex items-center gap-2 rounded-lg px-1 py-1 text-sm font-medium text-slate-500 transition hover:text-blue-700"
        >
          <ArrowLeft size={16} />
          Все инструкции
        </Link>
        <section className="mb-6 overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-[0_18px_50px_-38px_rgba(17,63,91,.45)]">
          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="flex min-w-0 items-start gap-4">
              <span className="hidden size-12 shrink-0 place-items-center rounded-xl bg-[var(--secondary)] text-[var(--primary)] sm:grid">
                <FileText size={22} />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {editor.editing ? "Редактирование инструкции" : "Новая инструкция"}
                  </h1>
                  <Badge className={articleStatusColors[editor.article.status]}>
                    {articleStatusLabels[editor.article.status]}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Соберите материал, проверьте его вид и опубликуйте — всё на одном экране.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-500">
                  <span>{editor.wordCount} слов</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 size={14} />
                    {editor.readingTime} мин чтения
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5",
                      editor.dirty ? "text-amber-700" : "text-emerald-700",
                    )}
                  >
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        editor.dirty ? "bg-amber-500" : "bg-emerald-500",
                      )}
                    />
                    {editor.dirty
                      ? "Есть несохранённые изменения"
                      : editor.lastSavedAt
                        ? "Все изменения сохранены"
                        : "Готово к работе"}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              {editor.editing && (
                <Button
                  variant="destructive"
                  className="w-full sm:w-auto"
                  disabled={editor.saving || editor.deleting}
                  onClick={() => void editor.remove()}
                >
                  <Trash2 size={17} />
                  {editor.deleting ? "Удаляем..." : "Удалить"}
                </Button>
              )}
              <Button
                variant="ghost"
                className="w-full sm:w-auto"
                disabled={editor.deleting}
                onClick={() => editor.setPreviewOpen(true)}
              >
                <Eye size={17} />
                Превью
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                disabled={editor.saving || editor.deleting}
                onClick={() => void editor.save()}
              >
                {editor.saving ? (
                  <Loader2 className="animate-spin" size={17} />
                ) : (
                  <Save size={17} />
                )}
                Сохранить
              </Button>
              <Button
                className="col-span-2 w-full sm:w-auto"
                disabled={editor.saving || editor.deleting}
                onClick={() => void editor.save("published", true)}
              >
                {editor.saving ? "Сохранение..." : "Опубликовать"}
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3 sm:flex-row sm:items-center sm:px-6">
            <div className="flex items-center justify-between gap-4 text-xs font-semibold text-slate-600 sm:w-52">
              <span>Готовность материала</span>
              <span className="text-[var(--primary)]">{editor.readyPercent}%</span>
            </div>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
              <div
                className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
                style={{ width: `${editor.readyPercent}%` }}
              />
            </div>
          </div>
        </section>
        {editor.error && (
          <p
            className="mb-5 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
            role="alert"
          >
            {editor.error}
          </p>
        )}
        <div className="grid items-start gap-6 min-[1450px]:grid-cols-[minmax(0,1fr)_340px]">
          <div className="article-editor-main min-w-0 space-y-6">
            <ArticleTemplates onApply={editor.applyTemplate} />
            <ArticleContentEditor
              article={editor.article}
              plainText={editor.plainText}
              onTitleChange={editor.updateTitle}
              onUpdate={editor.update}
              onGenerateExcerpt={editor.generateExcerpt}
            />
          </div>
          <aside className="article-editor-sidebar min-w-0 min-[1450px]:sticky min-[1450px]:top-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Настройки материала</CardTitle>
                <p className="mt-1 text-sm text-slate-500">Всё необходимое перед публикацией.</p>
              </CardHeader>
              <CardContent className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">Статус</span>
                  <Select
                    className="w-full"
                    value={editor.article.status}
                    onChange={(event) =>
                      editor.update("status", event.target.value as ArticleStatus)
                    }
                  >
                    {Object.entries(articleStatusLabels).map(([value, label]) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="block">
                  <span className="mb-2 flex items-center justify-between gap-3 text-sm font-medium">
                    <span>Адрес страницы</span>
                    <button
                      type="button"
                      className="inline-flex shrink-0 items-center gap-1 text-xs text-blue-700 hover:text-blue-900"
                      onClick={editor.refreshSlug}
                    >
                      <RefreshCcw size={13} />
                      Обновить
                    </button>
                  </span>
                  <Input
                    value={editor.article.slug}
                    onChange={(event) => editor.updateSlug(event.target.value)}
                    placeholder="article-slug"
                  />
                </label>
                <div className="flex min-w-0 items-center gap-2 rounded-lg bg-slate-50 p-2 pl-3 text-xs text-slate-600">
                  <span className="min-w-0 flex-1 truncate" title={editor.publicPath}>
                    {editor.publicPath}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    title="Скопировать"
                    onClick={() => void editor.copyPath()}
                  >
                    {editor.copied ? <Check size={15} /> : <Clipboard size={15} />}
                  </Button>
                </div>
                <ArticleCoverEditor
                  article={editor.article}
                  uploading={editor.coverUploading}
                  onUpdate={editor.update}
                  onUpload={editor.uploadCover}
                />
                {editor.lastSavedAt && (
                  <p className="border-t border-slate-100 pt-4 text-xs text-slate-500">
                    Сохранено в{" "}
                    {editor.lastSavedAt.toLocaleTimeString("ru-RU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    · Ctrl/⌘ + S
                  </p>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
        <ArticlePreview
          article={editor.article}
          open={editor.previewOpen}
          onClose={() => editor.setPreviewOpen(false)}
        />
      </div>
    </AdminLayout>
  );
}
