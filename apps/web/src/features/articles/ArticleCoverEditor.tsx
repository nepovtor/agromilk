import { type PointerEvent as ReactPointerEvent, useRef, useState } from "react";
import type { ArticleInput } from "@landing/shared";
import { ImagePlus, Loader2, UploadCloud } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ArticleCoverEditorProps = {
  article: ArticleInput;
  uploading: boolean;
  onUpdate: <K extends keyof ArticleInput>(key: K, value: ArticleInput[K]) => void;
  onUpload: (file?: File) => Promise<void>;
};

export function ArticleCoverEditor({
  article,
  uploading,
  onUpdate,
  onUpload,
}: ArticleCoverEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const upload = async (file?: File) => {
    await onUpload(file);
    if (fileRef.current) fileRef.current.value = "";
    setDragging(false);
  };

  const setFocus = (event: ReactPointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    onUpdate(
      "coverImagePositionX",
      Math.round(Math.min(100, Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100))),
    );
    onUpdate(
      "coverImagePositionY",
      Math.round(Math.min(100, Math.max(0, ((event.clientY - bounds.top) / bounds.height) * 100))),
    );
  };

  const moveFocus = (deltaX: number, deltaY: number) => {
    onUpdate(
      "coverImagePositionX",
      Math.min(100, Math.max(0, article.coverImagePositionX + deltaX)),
    );
    onUpdate(
      "coverImagePositionY",
      Math.min(100, Math.max(0, article.coverImagePositionY + deltaY)),
    );
  };

  return (
    <div className="border-t border-slate-100 pt-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">Обложка</p>
          <p className="mt-0.5 text-xs text-slate-400">JPG, PNG, WebP или GIF</p>
        </div>
        {article.coverImageUrl && (
          <button
            type="button"
            className="text-xs font-medium text-red-600 hover:text-red-800"
            onClick={() => onUpdate("coverImageUrl", "")}
          >
            Удалить
          </button>
        )}
      </div>
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-dashed border-[var(--border)] bg-slate-50 transition",
          dragging && "border-blue-400 bg-blue-50",
        )}
        onDragEnter={(event) => {
          if (event.dataTransfer.types.includes("Files")) setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          void upload(event.dataTransfer.files[0]);
        }}
      >
        {article.coverImageUrl ? (
          <div
            className="group relative aspect-video w-full touch-none select-none overflow-hidden bg-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]"
            role="application"
            tabIndex={0}
            aria-label="Выбор главной точки фотографии. Нажмите или перетащите маркер по фотографии."
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              setFocus(event);
            }}
            onPointerMove={(event) => {
              if (event.buttons === 1) setFocus(event);
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
              moveFocus(...movement);
            }}
          >
            {article.coverImageScale < 100 && (
              <img
                src={article.coverImageUrl}
                alt=""
                aria-hidden="true"
                className="absolute -inset-6 h-[calc(100%+3rem)] w-[calc(100%+3rem)] max-w-none scale-105 object-cover opacity-80 blur-2xl"
                style={{
                  objectPosition: `${article.coverImagePositionX}% ${article.coverImagePositionY}%`,
                }}
              />
            )}
            <img
              src={article.coverImageUrl}
              alt=""
              className={cn(
                "z-10 block object-cover",
                article.coverImageScale < 100
                  ? "absolute left-1/2 top-1/2 object-contain transition-[width,height] duration-150 ease-out"
                  : "relative h-full w-full",
              )}
              style={
                article.coverImageScale < 100
                  ? {
                      width: `${article.coverImageScale}%`,
                      height: `${article.coverImageScale}%`,
                      transform: "translate(-50%, -50%)",
                      objectPosition: `${article.coverImagePositionX}% ${article.coverImagePositionY}%`,
                    }
                  : {
                      objectPosition: `${article.coverImagePositionX}% ${article.coverImagePositionY}%`,
                    }
              }
            />
            <span className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-full bg-slate-950/70 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm backdrop-blur">
              Нажмите на главный объект
            </span>
            <span
              className="pointer-events-none absolute z-20 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-[var(--primary)] shadow-[0_2px_12px_rgba(0,0,0,.45)] transition-[left,top] duration-100"
              style={{
                left: `${article.coverImagePositionX}%`,
                top: `${article.coverImagePositionY}%`,
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
              disabled={uploading}
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
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="animate-spin text-blue-600" />
            ) : (
              <UploadCloud className="text-blue-600" />
            )}
            <span className="font-medium text-slate-700">
              {uploading ? "Загрузка..." : "Добавить обложку"}
            </span>
            <span className="text-xs text-slate-400">или перетащите файл сюда</span>
          </button>
        )}
      </div>
      {article.coverImageUrl && (
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
              <span>Размер изображения</span>
              <strong className="text-[var(--primary)]">{article.coverImageScale}%</strong>
            </span>
            <input
              type="range"
              min="40"
              max="100"
              step="1"
              value={article.coverImageScale}
              className="block w-full accent-[var(--primary)]"
              onChange={(event) => onUpdate("coverImageScale", Number(event.target.value))}
            />
            <span className="mt-1 flex justify-between text-[11px] text-slate-400">
              <span>Меньше, с размытым фоном</span>
              <span>На весь прямоугольник</span>
            </span>
          </label>
          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm font-medium text-slate-700">Центр кадра</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Нажмите на важный объект прямо на фотографии или перетащите фиолетовый маркер.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                onUpdate("coverImagePositionX", 50);
                onUpdate("coverImagePositionY", 50);
              }}
            >
              Центрировать фотографию
            </Button>
            <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50">
              <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-slate-600">
                Точная настройка
              </summary>
              <div className="space-y-3 border-t border-slate-200 p-3">
                <CoverPosition
                  label="Горизонталь"
                  value={article.coverImagePositionX}
                  onChange={(value) => onUpdate("coverImagePositionX", value)}
                />
                <CoverPosition
                  label="Вертикаль"
                  value={article.coverImagePositionY}
                  onChange={(value) => onUpdate("coverImagePositionY", value)}
                />
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
        onChange={(event) => void upload(event.target.files?.[0])}
      />
    </div>
  );
}

function CoverPosition({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid grid-cols-[92px_1fr_36px] items-center gap-2 text-xs text-slate-500">
      <span>{label}</span>
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={value}
        className="w-full accent-[var(--primary)]"
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="text-right">{value}%</span>
    </label>
  );
}
