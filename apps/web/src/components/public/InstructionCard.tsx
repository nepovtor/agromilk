import { Link } from "wouter";
import { BookOpen } from "@/components/icons";
import { agromilkAsset } from "@/lib/agromilkAssets";

type InstructionCardProps = {
  excerpt: string;
  href: string;
  image?: string | null;
  title: string;
};

export function InstructionCard({ excerpt, href, image, title }: InstructionCardProps) {
  return (
    <Link className="agro-instruction-card" href={href}>
      <div className="agro-instruction-card__image">
        {image ? <img src={image} alt="" /> : <BookOpen size={64} aria-hidden="true" />}
      </div>
      <div className="agro-instruction-card__content">
        <h2>{title}</h2>
        <p>{excerpt}</p>
      </div>
      <img
        className="agro-instruction-card__arrow"
        src={agromilkAsset("instruction-arrow.svg")}
        alt=""
      />
    </Link>
  );
}
