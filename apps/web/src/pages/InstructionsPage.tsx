import { useEffect, useState } from "react";
import type { ArticleRecord } from "@landing/shared";
import { Link } from "wouter";
import { api } from "@/api";
import { PublicLayout } from "@/components/PublicLayout";
import { BookOpen } from "@/components/icons";
import { InstructionCard } from "@/components/public/InstructionCard";
import { PublicState } from "@/components/public/PublicState";
import { agromilkAsset } from "@/lib/agromilkAssets";

type InstructionPresentation = {
  order: number;
  title: string;
  image: string;
  excerpt: string;
};

const instructionPresentationBySlug: Record<string, InstructionPresentation> = {
  "kak-prigotovit-zamenitel-moloka": {
    order: 1,
    title: "Как правильно приготовить заменитель молока",
    image: agromilkAsset("instruction-prepare-milk.png"),
    excerpt:
      "Пошаговая инструкция по разделению смеси, выбору темеературы воды и необходимой дозировки",
  },
  "dozirovka-po-vozrastu": {
    order: 2,
    title: "Таблица дозировки по возрасту животного",
    image: agromilkAsset("instruction-dosage-calf.png"),
    excerpt: "Рекомендуемые нормы расхода заменителя молока для телят на каждом этапе роста",
  },
  "temperatura-gotovoy-smesi": {
    order: 3,
    title: "Какой должна быть температура готовой смеси",
    image: agromilkAsset("instruction-temperature.png"),
    excerpt: "Оптимальная температура воды и готовой смеси для здоровья и хорошего усвоения.",
  },
  "perevod-telenka-na-zcm": {
    order: 4,
    title: "Как переводить теленка на ЗЦМ",
    image: agromilkAsset("instruction-transition-calves.png"),
    excerpt: "Пошаговая схема перевода теленка с молока или молозива на заменитель молока.",
  },
};

export function InstructionsPage() {
  const [data, setData] = useState<ArticleRecord[] | null>(null);
  const [error, setError] = useState("");
  const articles =
    data &&
    [...data].sort((a, b) => {
      const aOrder = instructionPresentationBySlug[a.slug]?.order;
      const bOrder = instructionPresentationBySlug[b.slug]?.order;

      if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder;
      if (aOrder !== undefined) return -1;
      if (bOrder !== undefined) return 1;
      return 0;
    });

  useEffect(() => {
    let cancelled = false;

    api.articles
      .publicList(1, 50)
      .then(async (firstPage) => {
        const remainingPages = Array.from(
          { length: firstPage.pagination.totalPages - 1 },
          (_, index) => api.articles.publicList(index + 2, 50),
        );
        const remaining = await Promise.all(remainingPages);
        if (cancelled) return;

        setData([...firstPage.items, ...remaining.flatMap((page) => page.items)]);
        setError("");
      })
      .catch((cause: unknown) => {
        if (!cancelled)
          setError(cause instanceof Error ? cause.message : "Не удалось загрузить инструкции");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PublicLayout variant="instructions">
      <section className="agro-instructions-hero">
        <div className="agro-instructions-container agro-instructions-hero__inner">
          <nav className="agro-instructions-breadcrumb" aria-label="Хлебные крошки">
            <Link href="/">Главная</Link>
            <span aria-hidden="true">/</span>
            <span>Инструкции</span>
          </nav>
          <div className="agro-instructions-hero__copy">
            <h1>ИНСТРУКЦИИ</h1>
            <strong>База знаний</strong>
            <p>
              Полезные материалы по применению нашей продукции.
              <br /> Выберите интересующую вас тему и ознакомьтесь с инструкцией
            </p>
          </div>
          <img
            className="agro-instructions-hero__lines"
            src={agromilkAsset("wave-mobile.svg")}
            alt=""
            aria-hidden="true"
          />
        </div>
      </section>
      <section className="agro-instructions">
        <div className="agro-instructions-container">
          {error && <PublicState error>{error}</PublicState>}
          {!data && !error && <PublicState>Загружаем материалы…</PublicState>}
          {data && articles?.length === 0 && (
            <PublicState>
              <BookOpen size={34} className="mx-auto mb-3" />
              <p>Опубликованных инструкций пока нет.</p>
            </PublicState>
          )}
          {articles && articles.length > 0 && (
            <div className="agro-instruction-list">
              {articles.map((article) => {
                const presentation = instructionPresentationBySlug[article.slug];

                return (
                  <InstructionCard
                    key={article.id}
                    href={`/instructions/${article.slug}`}
                    image={article.coverImageUrl || presentation?.image}
                    title={presentation?.title || article.title}
                    excerpt={
                      presentation?.excerpt ||
                      article.excerpt ||
                      "Открыть материал и ознакомиться с инструкцией."
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
