import type { ArticleInput, ArticleRecord, ArticleStatus } from "@agromilk/shared";

export const emptyArticle: ArticleInput = {
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

export const articleStatusLabels: Record<ArticleStatus, string> = {
  draft: "Черновик",
  published: "Опубликована",
  archived: "В архиве",
};

export const articleStatusColors: Record<ArticleStatus, string> = {
  draft: "bg-amber-100 text-amber-800",
  published: "bg-[#e8f5df] text-[#275a24]",
  archived: "bg-slate-100 text-slate-700",
};

export function articleToInput(article: ArticleRecord): ArticleInput {
  return {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    coverImageUrl: article.coverImageUrl || "",
    coverImageScale: article.coverImageScale ?? 100,
    coverImagePositionX: article.coverImagePositionX ?? 50,
    coverImagePositionY: article.coverImagePositionY ?? 50,
    status: article.status,
  };
}

export type ArticleTemplate = {
  title: string;
  excerpt: string;
  content: string;
};
