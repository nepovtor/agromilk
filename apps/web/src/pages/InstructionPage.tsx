import { type CSSProperties, useEffect, useState } from "react";
import type { ArticleRecord } from "@landing/shared";
import { Link, useParams } from "wouter";
import { api } from "@/api/client";
import { PublicLayout } from "@/components/PublicLayout";
import { PublicState } from "@/components/public/PublicState";

type ArticleBreadcrumbProps = {
  bottom?: boolean;
  title: string;
};

function ArticleBreadcrumb({ title, bottom = false }: ArticleBreadcrumbProps) {
  const positionClass = bottom
    ? " agro-article-detail__breadcrumb--bottom"
    : "";

  return (
    <nav
      className={`agro-article-detail__breadcrumb${positionClass}`}
      aria-label={bottom ? "Навигация после статьи" : "Навигационная цепочка"}
    >
      <span className="agro-article-detail__breadcrumb-parent">
        <Link href="/">Главная</Link>
        <span aria-hidden="true">/</span>
        <Link href="/instructions">Инструкции</Link>
      </span>
      <span className="agro-article-detail__breadcrumb-current">
        <span aria-hidden="true">/</span>
        <span>{title}</span>
      </span>
    </nav>
  );
}

function ArticleRequestState({ error }: { error?: string }) {
  return (
    <section className="agro-article-detail__state">
      <PublicState error={Boolean(error)}>
        {error || "Загружаем инструкцию…"}
      </PublicState>
    </section>
  );
}

export function InstructionPage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<ArticleRecord | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (slug) {
      api.articles
        .publicGet(slug)
        .then(setArticle)
        .catch((e) => setError(e.message));
    }
  }, [slug]);

  const coverPositionX = article?.coverImagePositionX ?? 50;
  const coverPositionY = article?.coverImagePositionY ?? 50;

  return (
    <PublicLayout variant="article">
      {error ? (
        <ArticleRequestState error={error} />
      ) : !article ? (
        <ArticleRequestState />
      ) : (
        <article className="agro-article-detail">
          <header
            className={`agro-article-detail__hero${
              article.coverImageUrl
                ? " agro-article-detail__hero--with-cover"
                : ""
            }`}
          >
            {article.coverImageUrl && (
              <div
                className={`agro-article-detail__cover-frame${
                  article.coverImageScale < 100
                    ? " agro-article-detail__cover-frame--scaled"
                    : ""
                }`}
                style={
                  {
                    "--article-cover-scale": `${article.coverImageScale}%`,
                    "--article-cover-position-x": `${coverPositionX}%`,
                    "--article-cover-position-y": `${coverPositionY}%`,
                  } as CSSProperties
                }
              >
                {article.coverImageScale < 100 && (
                  <img
                    className="agro-article-detail__cover-background"
                    src={article.coverImageUrl}
                    alt=""
                    aria-hidden="true"
                  />
                )}
                <img
                  className="agro-article-detail__cover"
                  src={article.coverImageUrl}
                  alt={`Обложка инструкции «${article.title}»`}
                />
              </div>
            )}
            <div className="agro-article-detail__hero-inner">
              <ArticleBreadcrumb title={article.title} />
              <h1>{article.title}</h1>
              {article.excerpt && (
                <p className="agro-article-detail__lead">{article.excerpt}</p>
              )}
            </div>
          </header>
          <section className="agro-article-detail__body">
            <div className="agro-article-detail__body-inner">
              <div
                className="agro-article-detail__prose prose"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
              <ArticleBreadcrumb title={article.title} bottom />
            </div>
          </section>
        </article>
      )}
    </PublicLayout>
  );
}
