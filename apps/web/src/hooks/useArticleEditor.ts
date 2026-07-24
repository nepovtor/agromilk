import { useCallback, useEffect, useMemo, useState } from "react";
import type { ArticleInput, ArticleStatus } from "@landing/shared";
import { api } from "@/api";
import { slugify } from "@/lib/utils";
import {
  articleToInput,
  emptyArticle,
  type ArticleTemplate,
} from "@/features/articles/article-editor.types";

type UseArticleEditorOptions = {
  id?: string;
  navigate: (path: string) => void;
};

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function errorMessage(cause: unknown, fallback: string) {
  return cause instanceof Error ? cause.message : fallback;
}

export function useArticleEditor({ id, navigate }: UseArticleEditorOptions) {
  const editing = Boolean(id && id !== "new");
  const [article, setArticle] = useState<ArticleInput>(emptyArticle);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [error, setError] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);

  const plainText = useMemo(() => stripHtml(article.content), [article.content]);
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 180));
  const publicPath = `/instructions/${article.slug || "..."}`;
  const checks = [
    article.title.trim().length >= 3,
    article.excerpt.trim().length >= 40,
    wordCount >= 80,
    Boolean(article.coverImageUrl),
    Boolean(article.slug),
  ];
  const readyPercent = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  const update = useCallback(<K extends keyof ArticleInput>(key: K, value: ArticleInput[K]) => {
    setArticle((current) => ({ ...current, [key]: value }));
    setDirty(true);
  }, []);

  const updateTitle = useCallback(
    (title: string) => {
      update("title", title);
      if (!slugTouched) update("slug", slugify(title));
    },
    [slugTouched, update],
  );

  useEffect(() => {
    if (!editing || !id) return;
    api.articles
      .get(id)
      .then((item) => {
        setArticle(articleToInput(item));
        setSlugTouched(true);
        setDirty(false);
      })
      .catch((cause: unknown) => setError(errorMessage(cause, "Не удалось загрузить материал")))
      .finally(() => setLoading(false));
  }, [editing, id]);

  const save = useCallback(
    async (status?: ArticleStatus, returnToList = false) => {
      setSaving(true);
      setError("");
      const payload = { ...article, status: status ?? article.status };
      try {
        const saved =
          editing && id
            ? await api.articles.update(id, payload)
            : await api.articles.create(payload);
        setArticle(articleToInput(saved));
        setSlugTouched(true);
        setLastSavedAt(new Date());
        setDirty(false);
        if (returnToList) navigate("/admin/articles");
        else if (!editing) navigate(`/admin/articles/${saved.id}/edit`);
      } catch (cause) {
        setError(errorMessage(cause, "Ошибка сохранения"));
      } finally {
        setSaving(false);
      }
    },
    [article, editing, id, navigate],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (!saving) void save(article.status);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [article.status, save, saving]);

  const applyTemplate = useCallback(
    (template: ArticleTemplate) => {
      if (article.content && !window.confirm("Заменить текущий текст шаблоном?")) return;
      setArticle((current) => ({
        ...current,
        title: current.title || template.title,
        slug: current.slug || slugify(template.title),
        excerpt: current.excerpt || template.excerpt,
        content: template.content,
      }));
      setDirty(true);
    },
    [article.content],
  );

  const generateExcerpt = useCallback(() => {
    const excerpt = plainText.slice(0, 220).replace(/\s+\S*$/, "");
    update("excerpt", excerpt || article.title);
  }, [article.title, plainText, update]);

  const uploadCover = useCallback(
    async (file?: File) => {
      if (!file || !file.type.startsWith("image/")) return;
      setCoverUploading(true);
      setError("");
      try {
        const result = await api.media.upload(file);
        update("coverImageUrl", result.url);
      } catch (cause) {
        setError(errorMessage(cause, "Ошибка загрузки"));
      } finally {
        setCoverUploading(false);
      }
    },
    [update],
  );

  const remove = useCallback(async () => {
    if (!id || !editing) return;
    if (
      !window.confirm(
        `Удалить «${article.title.trim() || "материал без названия"}» без возможности восстановления?`,
      )
    )
      return;
    setDeleting(true);
    setError("");
    try {
      await api.articles.remove(id);
      navigate("/admin/articles");
    } catch (cause) {
      setError(errorMessage(cause, "Не удалось удалить материал"));
      setDeleting(false);
    }
  }, [article.title, editing, id, navigate]);

  const copyPath = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(publicPath);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch (cause) {
      setError(errorMessage(cause, "Не удалось скопировать адрес"));
    }
  }, [publicPath]);

  return {
    article,
    editing,
    loading,
    saving,
    deleting,
    coverUploading,
    error,
    previewOpen,
    copied,
    lastSavedAt,
    dirty,
    plainText,
    wordCount,
    readingTime,
    publicPath,
    readyPercent,
    update,
    updateTitle,
    save,
    applyTemplate,
    generateExcerpt,
    uploadCover,
    remove,
    copyPath,
    setPreviewOpen,
    setSlugTouched,
    refreshSlug: () => {
      setSlugTouched(false);
      update("slug", slugify(article.title));
    },
    updateSlug: (value: string) => {
      setSlugTouched(true);
      update("slug", value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
    },
  };
}
