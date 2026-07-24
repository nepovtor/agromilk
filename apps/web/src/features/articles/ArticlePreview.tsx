import { useMemo, useState } from "react";
import type { ArticleInput } from "@landing/shared";
import { Laptop, Smartphone, X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function previewDocument(article: ArticleInput) {
  const cover = article.coverImageUrl
    ? `<div class="cover-frame${article.coverImageScale < 100 ? " scaled" : ""}" style="--cover-scale:${article.coverImageScale}%;--cover-x:${article.coverImagePositionX}%;--cover-y:${article.coverImagePositionY}%">${article.coverImageScale < 100 ? `<img class="cover-bg" src="${escapeHtml(article.coverImageUrl)}" alt="">` : ""}<img class="cover" src="${escapeHtml(article.coverImageUrl)}" alt=""></div>`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>*{box-sizing:border-box}body{max-width:760px;margin:40px auto;padding:0 20px;font:16px/1.7 system-ui;color:#172033}img,iframe{max-width:100%;border-radius:14px}.cover-frame{position:relative;aspect-ratio:16/9;width:100%;overflow:hidden;margin:0 0 28px;border-radius:14px;background:#e9edf0}.cover-frame .cover{width:100%;height:100%;object-fit:cover;object-position:var(--cover-x) var(--cover-y);border-radius:0}.cover-frame.scaled .cover{position:absolute;top:50%;left:50%;z-index:1;width:var(--cover-scale);height:var(--cover-scale);object-fit:contain;object-position:var(--cover-x) var(--cover-y);transform:translate(-50%,-50%)}.cover-bg{position:absolute;inset:-28px;width:calc(100% + 56px);height:calc(100% + 56px);max-width:none;object-fit:cover;object-position:var(--cover-x) var(--cover-y);border-radius:0;filter:blur(24px);opacity:.78;transform:scale(1.06)}h1{font-size:34px;line-height:1.15;margin:0 0 12px}h2{margin-top:34px;line-height:1.25}.excerpt{color:#667085;font-size:18px;margin-bottom:26px}.tableWrapper{max-width:100%;overflow-x:auto;margin:24px 0;border:1px solid #d9e2ec;border-radius:12px}table{width:100%;border-collapse:collapse;background:#fff}th,td{min-width:120px;border-right:1px solid #d9e2ec;border-bottom:1px solid #d9e2ec;padding:10px 12px;text-align:left;vertical-align:top}th{background:#eef7fc}tr:last-child>*{border-bottom:0}tr>*:last-child{border-right:0}table p{margin:0}</style></head><body>${cover}<h1>${escapeHtml(article.title || "Без названия")}</h1>${article.excerpt ? `<p class="excerpt">${escapeHtml(article.excerpt)}</p>` : ""}${article.content}</body></html>`;
}

export function ArticlePreview({
  article,
  open,
  onClose,
}: {
  article: ArticleInput;
  open: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"desktop" | "mobile">("desktop");
  const srcDoc = useMemo(() => previewDocument(article), [article]);
  if (!open) return null;

  return (
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
              variant={mode === "desktop" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMode("desktop")}
            >
              <Laptop size={15} />
              <span className="hidden sm:inline">Desktop</span>
            </Button>
            <Button
              variant={mode === "mobile" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMode("mobile")}
            >
              <Smartphone size={15} />
              <span className="hidden sm:inline">Mobile</span>
            </Button>
            <Button variant="ghost" size="icon" aria-label="Закрыть предпросмотр" onClick={onClose}>
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
              mode === "mobile" ? "w-[390px] max-w-full" : "w-full",
            )}
            srcDoc={srcDoc}
          />
        </div>
      </div>
    </div>
  );
}
