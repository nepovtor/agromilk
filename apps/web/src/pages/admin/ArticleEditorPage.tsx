import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ArticleInput,
  ArticleRecord,
  ArticleStatus,
} from "@landing/shared";
import { Link, useLocation, useParams } from "wouter";
import {
  ArrowLeft,
  Check,
  Clipboard,
  Clock3,
  Eye,
  FileText,
  ImagePlus,
  Laptop,
  Loader2,
  RefreshCcw,
  Save,
  Smartphone,
  Sparkles,
  Trash2,
  UploadCloud,
  Wand2,
  X,
} from "@/components/icons";
import { api } from "@/api/client";
import { AdminLayout } from "@/components/AdminLayout";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn, slugify } from "@/lib/utils";

const empty: ArticleInput = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImageUrl: "",
  coverImageScale: 100,
  coverImagePositionX: 50,
  coverImagePositionY: 50,
  status: "draft",
};

const statusLabels: Record<ArticleStatus, string> = {
  draft: "Черновик",
  published: "Опубликована",
  archived: "В архиве",
};

const statusColors: Record<ArticleStatus, string> = {
  draft: "bg-amber-100 text-amber-800",
  published: "bg-[#e8f5df] text-[#275a24]",
  archived: "bg-slate-100 text-slate-700",
};

const templates = [
  {
    key: "guide",
    label: "Рекомендация",
    icon: FileText,
    title: "Как подготовить рацион ...",
    excerpt:
      "Короткий разбор с нормами, частыми ошибками и финальной проверкой.",
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
];

const stripHtml = (html: string) =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const toInput = (article: ArticleRecord): ArticleInput => ({
  title: article.title,
  slug: article.slug,
  excerpt: article.excerpt,
  content: article.content,
  coverImageUrl: article.coverImageUrl || "",
  coverImageScale: article.coverImageScale ?? 100,
  coverImagePositionX: article.coverImagePositionX ?? 50,
  coverImagePositionY: article.coverImagePositionY ?? 50,
  status: article.status,
});

export function ArticleEditorPage() {
  const { id } = useParams<{ id?: string }>();
  const editing = Boolean(id && id !== "new");
  const [, navigate] = useLocation();
  const [data, setData] = useState<ArticleInput>(empty);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverDragging, setCoverDragging] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [slugTouched, setSlugTouched] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && id) {
      api.articles
        .get(id)
        .then((article) => {
          setData(toInput(article));
          setSlugTouched(true);
          setDirty(false);
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [editing, id]);

  const plainText = useMemo(() => stripHtml(data.content), [data.content]);
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 180));
  const publicPath = `/instructions/${data.slug || "..."}`;
  const checks = [
    { label: "Заголовок", done: data.title.trim().length >= 3 },
    { label: "Описание", done: data.excerpt.trim().length >= 40 },
    { label: "Текст", done: wordCount >= 80 },
    { label: "Обложка", done: Boolean(data.coverImageUrl) },
    { label: "Адрес", done: Boolean(data.slug) },
  ];
  const readyPercent = Math.round(
    (checks.filter((item) => item.done).length / checks.length) * 100,
  );
  const titleLimit = 200;
  const excerptLimit = 500;

  const update = <K extends keyof ArticleInput>(
    key: K,
    value: ArticleInput[K],
  ) => {
    setData((current) => ({ ...current, [key]: value }));
    setDirty(true);
  };

  const save = useCallback(
    async (
      status?: ArticleStatus,
      options: { returnToList?: boolean } = {},
    ) => {
      setSaving(true);
      setError("");
      const payload = { ...data, status: status ?? data.status };
      try {
        const saved =
          editing && id
            ? await api.articles.update(id, payload)
            : await api.articles.create(payload);
        setData(toInput(saved));
        setSlugTouched(true);
        setLastSavedAt(new Date());
        setDirty(false);
        if (options.returnToList) navigate("/admin/articles");
        else if (!editing) navigate(`/admin/articles/${saved.id}/edit`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка сохранения");
      } finally {
        setSaving(false);
      }
    },
    [data, editing, id, navigate],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (!saving) void save(data.status);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [data.status, save, saving]);

  const applyTemplate = (template: (typeof templates)[number]) => {
    if (data.content && !window.confirm("Заменить текущий текст шаблоном?"))
      return;
    setData((current) => ({
      ...current,
      title: current.title || template.title,
      slug: current.slug || slugify(template.title),
      excerpt: current.excerpt || template.excerpt,
      content: template.content,
    }));
    setDirty(true);
  };

  const generateExcerpt = () => {
    const next = plainText.slice(0, 220).replace(/\s+\S*$/, "");
    update("excerpt", next || data.title);
  };

  const uploadCover = async (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    setCoverUploading(true);
    setError("");
    try {
      const result = await api.media.upload(file);
      update("coverImageUrl", result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setCoverUploading(false);
      setCoverDragging(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const copyPath = async () => {
    await navigator.clipboard.writeText(publicPath);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  const centerCover = () => {
    setData((current) => ({
      ...current,
      coverImagePositionX: 50,
      coverImagePositionY: 50,
    }));
    setDirty(true);
  };

  const moveCoverFocus = (deltaX: number, deltaY: number) => {
    setData((current) => ({
      ...current,
      coverImagePositionX: Math.min(
        100,
        Math.max(0, current.coverImagePositionX + deltaX),
      ),
      coverImagePositionY: Math.min(
        100,
        Math.max(0, current.coverImagePositionY + deltaY),
      ),
    }));
    setDirty(true);
  };

  const setCoverFocus = (event: ReactPointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const positionX = Math.round(
      Math.min(100, Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100)),
    );
    const positionY = Math.round(
      Math.min(100, Math.max(0, ((event.clientY - bounds.top) / bounds.height) * 100)),
    );
    setData((current) => ({
      ...current,
      coverImagePositionX: positionX,
      coverImagePositionY: positionY,
    }));
    setDirty(true);
  };

  const remove = async () => {
    if (!id || !editing) return;
    const title = data.title.trim() || "материал без названия";
    if (!window.confirm(`Удалить «${title}» без возможности восстановления?`))
      return;

    setDeleting(true);
    setError("");
    try {
      await api.articles.remove(id);
      navigate("/admin/articles");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Не удалось удалить материал",
      );
      setDeleting(false);
    }
  };

  const previewCover = data.coverImageUrl
    ? `<div class="cover-frame${data.coverImageScale < 100 ? " scaled" : ""}" style="--cover-scale:${data.coverImageScale}%;--cover-x:${data.coverImagePositionX}%;--cover-y:${data.coverImagePositionY}%">${data.coverImageScale < 100 ? `<img class="cover-bg" src="${escapeHtml(data.coverImageUrl)}" alt="">` : ""}<img class="cover" src="${escapeHtml(data.coverImageUrl)}" alt=""></div>`
    : "";
  const previewDoc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>*{box-sizing:border-box}body{max-width:760px;margin:40px auto;padding:0 20px;font:16px/1.7 system-ui;color:#172033}img,iframe{max-width:100%;border-radius:14px}.cover-frame{position:relative;aspect-ratio:16/9;width:100%;overflow:hidden;margin:0 0 28px;border-radius:14px;background:#e9edf0}.cover-frame .cover{width:100%;height:100%;object-fit:cover;object-position:var(--cover-x) var(--cover-y);border-radius:0}.cover-frame.scaled .cover{position:absolute;top:50%;left:50%;z-index:1;width:var(--cover-scale);height:var(--cover-scale);object-fit:contain;object-position:var(--cover-x) var(--cover-y);transform:translate(-50%,-50%)}.cover-bg{position:absolute;inset:-28px;width:calc(100% + 56px);height:calc(100% + 56px);max-width:none;object-fit:cover;object-position:var(--cover-x) var(--cover-y);border-radius:0;filter:blur(24px);opacity:.78;transform:scale(1.06)}h1{font-size:34px;line-height:1.15;margin:0 0 12px}h2{margin-top:34px;line-height:1.25}.excerpt{color:#667085;font-size:18px;margin-bottom:26px}.tableWrapper{max-width:100%;overflow-x:auto;margin:24px 0;border:1px solid #d9e2ec;border-radius:12px}table{width:100%;border-collapse:collapse;background:#fff}th,td{min-width:120px;border-right:1px solid #d9e2ec;border-bottom:1px solid #d9e2ec;padding:10px 12px;text-align:left;vertical-align:top}th{background:#eef7fc}tr:last-child>*{border-bottom:0}tr>*:last-child{border-right:0}table p{margin:0}</style></head><body>${previewCover}<h1>${escapeHtml(data.title || "Без названия")}</h1>${data.excerpt ? `<p class="excerpt">${escapeHtml(data.excerpt)}</p>` : ""}${data.content}</body></html>`;

  if (loading) {
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
                    {editing ? "Редактирование инструкции" : "Новая инструкция"}
                  </h1>
                  <Badge className={statusColors[data.status]}>
                    {statusLabels[data.status]}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Соберите материал, проверьте его вид и опубликуйте — всё на
                  одном экране.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-500">
                  <span>{wordCount} слов</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 size={14} />
                    {readingTime} мин чтения
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5",
                      dirty ? "text-amber-700" : "text-emerald-700",
                    )}
                  >
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        dirty ? "bg-amber-500" : "bg-emerald-500",
                      )}
                    />
                    {dirty
                      ? "Есть несохранённые изменения"
                      : lastSavedAt
                        ? "Все изменения сохранены"
                        : "Готово к работе"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              {editing && (
                <Button
                  variant="destructive"
                  className="w-full sm:w-auto"
                  disabled={saving || deleting}
                  onClick={() => void remove()}
                >
                  <Trash2 size={17} />
                  {deleting ? "Удаляем..." : "Удалить"}
                </Button>
              )}
              <Button
                variant="ghost"
                className="w-full sm:w-auto"
                disabled={deleting}
                onClick={() => setPreview(true)}
              >
                <Eye size={17} />
                Превью
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                disabled={saving || deleting}
                onClick={() => void save()}
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={17} />
                ) : (
                  <Save size={17} />
                )}
                Сохранить
              </Button>
              <Button
                className="col-span-2 w-full sm:w-auto"
                disabled={saving || deleting}
                onClick={() => void save("published", { returnToList: true })}
              >
                {saving ? "Сохранение..." : "Опубликовать"}
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3 sm:flex-row sm:items-center sm:px-6">
            <div className="flex items-center justify-between gap-4 text-xs font-semibold text-slate-600 sm:w-52">
              <span>Готовность материала</span>
              <span className="text-[var(--primary)]">{readyPercent}%</span>
            </div>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
              <div
                className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
                style={{ width: `${readyPercent}%` }}
              />
            </div>
          </div>
        </section>

        {error && (
          <p
            className="mb-5 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="grid items-start gap-6 min-[1450px]:grid-cols-[minmax(0,1fr)_340px]">
          <div className="article-editor-main min-w-0 space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--secondary)] text-xs font-extrabold text-[var(--primary)]">
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
                        className="group flex min-w-0 items-center gap-3 rounded-xl border border-[var(--border)] bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/60 hover:shadow-sm"
                        onClick={() => applyTemplate(template)}
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-600 transition group-hover:bg-white group-hover:text-[var(--primary)]">
                          <Icon size={17} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold leading-tight text-slate-800">
                            {template.label}
                          </span>
                          <span className="mt-1 block text-xs text-slate-400">
                            Готовая структура
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--secondary)] text-xs font-extrabold text-[var(--primary)]">
                    02
                  </span>
                  <div>
                    <CardTitle>Содержание</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">
                      Название, короткий анонс и основной текст инструкции.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <label className="block">
                  <span className="mb-2 flex items-center justify-between text-sm font-medium">
                    <span>Название</span>
                    <span className="text-xs text-slate-400">
                      {data.title.length}/{titleLimit}
                    </span>
                  </span>
                  <Input
                    value={data.title}
                    maxLength={titleLimit}
                    onChange={(event) => {
                      update("title", event.target.value);
                      if (!slugTouched)
                        update("slug", slugify(event.target.value));
                    }}
                    placeholder="Например: Как подготовить телят к смене рациона"
                    className="h-12 text-base font-semibold sm:text-lg"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center justify-between text-sm font-medium">
                    <span>Краткое описание</span>
                    <span className="text-xs text-slate-400">
                      {data.excerpt.length}/{excerptLimit}
                    </span>
                  </span>
                  <div className="space-y-2">
                    <Textarea
                      value={data.excerpt}
                      maxLength={excerptLimit}
                      onChange={(event) =>
                        update("excerpt", event.target.value)
                      }
                      placeholder="Смысл материала в одну-две строки"
                      className="min-h-24"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={generateExcerpt}
                      disabled={!plainText && !data.title}
                    >
                      <Sparkles size={15} />
                      Собрать выжимку
                    </Button>
                  </div>
                </label>

                <div className="min-w-0">
                  <span className="mb-2 block text-sm font-medium">
                    Текст материала
                  </span>
                  <RichTextEditor
                    value={data.content}
                    onChange={(value) => update("content", value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="article-editor-sidebar min-w-0 min-[1450px]:sticky min-[1450px]:top-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Настройки материала</CardTitle>
                <p className="mt-1 text-sm text-slate-500">
                  Всё необходимое перед публикацией.
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">Статус</span>
                  <Select
                    className="w-full"
                    value={data.status}
                    onChange={(event) =>
                      update("status", event.target.value as ArticleStatus)
                    }
                  >
                    <option value="draft">Черновик</option>
                    <option value="published">Опубликована</option>
                    <option value="archived">В архиве</option>
                  </Select>
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center justify-between gap-3 text-sm font-medium">
                    <span>Адрес страницы</span>
                    <button
                      type="button"
                      className="inline-flex shrink-0 items-center gap-1 text-xs text-blue-700 hover:text-blue-900"
                      onClick={() => {
                        setSlugTouched(false);
                        update("slug", slugify(data.title));
                      }}
                    >
                      <RefreshCcw size={13} />
                      Обновить
                    </button>
                  </span>
                  <Input
                    value={data.slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      update(
                        "slug",
                        event.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, ""),
                      );
                    }}
                    placeholder="article-slug"
                  />
                </label>

                <div className="flex min-w-0 items-center gap-2 rounded-lg bg-slate-50 p-2 pl-3 text-xs text-slate-600">
                  <span className="min-w-0 flex-1 truncate" title={publicPath}>
                    {publicPath}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    title="Скопировать"
                    onClick={() => void copyPath()}
                  >
                    {copied ? <Check size={15} /> : <Clipboard size={15} />}
                  </Button>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Обложка
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        JPG, PNG, WebP или GIF
                      </p>
                    </div>
                    {data.coverImageUrl && (
                      <button
                        type="button"
                        className="text-xs font-medium text-red-600 hover:text-red-800"
                        onClick={() => update("coverImageUrl", "")}
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                  <div
                    className={cn(
                      "overflow-hidden rounded-xl border border-dashed border-[var(--border)] bg-slate-50 transition",
                      coverDragging && "border-blue-400 bg-blue-50",
                    )}
                    onDragEnter={(event) => {
                      if (event.dataTransfer.types.includes("Files"))
                        setCoverDragging(true);
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDragLeave={() => setCoverDragging(false)}
                    onDrop={(event) => {
                      event.preventDefault();
                      void uploadCover(event.dataTransfer.files[0]);
                    }}
                  >
                    {data.coverImageUrl ? (
                      <div
                        className="group relative aspect-video w-full touch-none select-none overflow-hidden bg-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]"
                        role="application"
                        tabIndex={0}
                        aria-label="Выбор главной точки фотографии. Нажмите или перетащите маркер по фотографии."
                        onPointerDown={(event) => {
                          event.currentTarget.setPointerCapture(event.pointerId);
                          setCoverFocus(event);
                        }}
                        onPointerMove={(event) => {
                          if (event.buttons === 1) setCoverFocus(event);
                        }}
                        onKeyDown={(event) => {
                          const step = event.shiftKey ? 5 : 1;
                          const movements: Record<string, [number, number]> = {
                            ArrowLeft: [-step, 0],
                            ArrowRight: [step, 0],
                            ArrowUp: [0, -step],
                            ArrowDown: [0, step],
                          };
                          const movement = movements[event.key];
                          if (!movement) return;
                          event.preventDefault();
                          moveCoverFocus(...movement);
                        }}
                      >
                        {data.coverImageScale < 100 && (
                          <img
                            src={data.coverImageUrl}
                            alt=""
                            aria-hidden="true"
                            className="absolute -inset-6 h-[calc(100%+3rem)] w-[calc(100%+3rem)] max-w-none scale-105 object-cover opacity-80 blur-2xl"
                            style={{
                              objectPosition: `${data.coverImagePositionX}% ${data.coverImagePositionY}%`,
                            }}
                          />
                        )}
                        <img
                          src={data.coverImageUrl}
                          alt=""
                          className={cn(
                            "z-10 block object-cover",
                            data.coverImageScale < 100
                              ? "absolute left-1/2 top-1/2 object-contain transition-[width,height] duration-150 ease-out"
                              : "relative h-full w-full",
                          )}
                          style={
                            data.coverImageScale < 100
                              ? {
                                  width: `${data.coverImageScale}%`,
                                  height: `${data.coverImageScale}%`,
                                  transform: "translate(-50%, -50%)",
                                  objectPosition: `${data.coverImagePositionX}% ${data.coverImagePositionY}%`,
                                }
                              : {
                                  objectPosition: `${data.coverImagePositionX}% ${data.coverImagePositionY}%`,
                                }
                          }
                        />
                        <span className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-full bg-slate-950/70 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm backdrop-blur">
                          Нажмите на главный объект
                        </span>
                        <span
                          className="pointer-events-none absolute z-20 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-[var(--primary)] shadow-[0_2px_12px_rgba(0,0,0,.45)] transition-[left,top] duration-100"
                          style={{
                            left: `${data.coverImagePositionX}%`,
                            top: `${data.coverImagePositionY}%`,
                          }}
                          aria-hidden="true"
                        >
                          <span className="size-1.5 rounded-full bg-white" />
                        </span>
                        <button
                          type="button"
                          className="absolute bottom-3 right-3 z-30 inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-white/95 px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-white"
                          onPointerDown={(event) => event.stopPropagation()}
                          onClick={() => fileRef.current?.click()}
                          disabled={coverUploading}
                        >
                          <ImagePlus size={15} />
                          Заменить обложку
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="flex min-h-36 w-full flex-col items-center justify-center gap-2 p-5 text-center text-sm text-slate-500"
                        onClick={() => fileRef.current?.click()}
                        disabled={coverUploading}
                      >
                        {coverUploading ? (
                          <Loader2 className="animate-spin text-blue-600" />
                        ) : (
                          <UploadCloud className="text-blue-600" />
                        )}
                        <span className="font-medium text-slate-700">
                          {coverUploading ? "Загрузка..." : "Добавить обложку"}
                        </span>
                        <span className="text-xs text-slate-400">
                          или перетащите файл сюда
                        </span>
                      </button>
                    )}
                  </div>
                  {data.coverImageUrl && (
                    <div className="mt-4 space-y-4">
                      <label className="block">
                        <span className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
                          <span>Размер изображения</span>
                          <strong className="text-[var(--primary)]">
                            {data.coverImageScale}%
                          </strong>
                        </span>
                        <input
                          type="range"
                          min="40"
                          max="100"
                          step="1"
                          value={data.coverImageScale}
                          className="block w-full accent-[var(--primary)]"
                          onChange={(event) =>
                            update(
                              "coverImageScale",
                              Number(event.target.value),
                            )
                          }
                        />
                        <span className="mt-1 flex justify-between text-[11px] text-slate-400">
                          <span>Меньше, с размытым фоном</span>
                          <span>На весь прямоугольник</span>
                        </span>
                      </label>

                      <div className="border-t border-slate-100 pt-4">
                        <p className="text-sm font-medium text-slate-700">
                          Центр кадра
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Нажмите на важный объект прямо на фотографии или
                          перетащите фиолетовый маркер. Выбранная точка задаёт
                          фокус кадра при обрезке.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={centerCover}
                        >
                          Центрировать фотографию
                        </Button>
                        <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50">
                          <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-slate-600">
                            Точная настройка
                          </summary>
                          <div className="space-y-3 border-t border-slate-200 p-3">
                            <label className="grid grid-cols-[92px_1fr_36px] items-center gap-2 text-xs text-slate-500">
                              <span>Горизонталь</span>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="1"
                                value={data.coverImagePositionX}
                                className="w-full accent-[var(--primary)]"
                                onChange={(event) =>
                                  update(
                                    "coverImagePositionX",
                                    Number(event.target.value),
                                  )
                                }
                              />
                              <span className="text-right">
                                {data.coverImagePositionX}%
                              </span>
                            </label>
                            <label className="grid grid-cols-[92px_1fr_36px] items-center gap-2 text-xs text-slate-500">
                              <span>Вертикаль</span>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="1"
                                value={data.coverImagePositionY}
                                className="w-full accent-[var(--primary)]"
                                onChange={(event) =>
                                  update(
                                    "coverImagePositionY",
                                    Number(event.target.value),
                                  )
                                }
                              />
                              <span className="text-right">
                                {data.coverImagePositionY}%
                              </span>
                            </label>
                          </div>
                        </details>
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(event) =>
                      void uploadCover(event.target.files?.[0])
                    }
                  />
                </div>

                {lastSavedAt && (
                  <p className="border-t border-slate-100 pt-4 text-xs text-slate-500">
                    Сохранено в{" "}
                    {lastSavedAt.toLocaleTimeString("ru-RU", {
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

        {preview && (
          <div
            className="fixed inset-0 z-50 bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Предпросмотр статьи"
          >
            <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b p-2 sm:p-3">
                <span className="font-medium">Предпросмотр</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant={previewMode === "desktop" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setPreviewMode("desktop")}
                  >
                    <Laptop size={15} />
                    <span className="hidden sm:inline">Desktop</span>
                  </Button>
                  <Button
                    variant={previewMode === "mobile" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setPreviewMode("mobile")}
                  >
                    <Smartphone size={15} />
                    <span className="hidden sm:inline">Mobile</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Закрыть предпросмотр"
                    onClick={() => setPreview(false)}
                  >
                    <X />
                  </Button>
                </div>
              </div>
              <div className="grid min-h-0 flex-1 place-items-center overflow-auto bg-slate-100 p-4">
                <iframe
                  title="Предпросмотр статьи"
                  sandbox=""
                  className={cn(
                    "h-full min-h-[620px] rounded-2xl bg-white shadow-sm transition-all",
                    previewMode === "mobile"
                      ? "w-[390px] max-w-full"
                      : "w-full",
                  )}
                  srcDoc={previewDoc}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
