import type { ArticleInput } from "@agromilk/shared";
import { Sparkles } from "@/components/icons";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ArticleContentEditorProps = {
  article: ArticleInput;
  plainText: string;
  onTitleChange: (value: string) => void;
  onUpdate: <K extends keyof ArticleInput>(key: K, value: ArticleInput[K]) => void;
  onGenerateExcerpt: () => void;
};

export function ArticleContentEditor({
  article,
  plainText,
  onTitleChange,
  onUpdate,
  onGenerateExcerpt,
}: ArticleContentEditorProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-(--secondary) text-xs font-extrabold text-(--primary)">
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
            <span className="text-xs text-slate-400">{article.title.length}/200</span>
          </span>
          <Input
            value={article.title}
            maxLength={200}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="Например: Как подготовить телят к смене рациона"
            className="h-12 text-base font-semibold sm:text-lg"
          />
        </label>
        <label className="block">
          <span className="mb-2 flex items-center justify-between text-sm font-medium">
            <span>Краткое описание</span>
            <span className="text-xs text-slate-400">{article.excerpt.length}/500</span>
          </span>
          <div className="space-y-2">
            <Textarea
              value={article.excerpt}
              maxLength={500}
              onChange={(event) => onUpdate("excerpt", event.target.value)}
              placeholder="Смысл материала в одну-две строки"
              className="min-h-24"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onGenerateExcerpt}
              disabled={!plainText && !article.title}
            >
              <Sparkles size={15} />
              Собрать выжимку
            </Button>
          </div>
        </label>
        <div className="min-w-0">
          <span className="mb-2 block text-sm font-medium">Текст материала</span>
          <RichTextEditor
            value={article.content}
            onChange={(value) => onUpdate("content", value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
