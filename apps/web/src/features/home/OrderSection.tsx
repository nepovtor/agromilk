import { zodResolver } from "@hookform/resolvers/zod";
import {
  createApplicationSchema,
  type CreateApplicationInput,
  type ProductRecord,
} from "@agromilk/shared";
import { useCallback, useRef, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { Link } from "wouter";
import { api } from "@/api";
import { ArrowRight } from "@/components/icons";
import { getVisitorId } from "@/lib/analyticsIdentity";

const initialValues = {
  name: "",
  phone: "",
  email: "",
  message: "",
  consent: true as const,
  website: "",
};

export type OrderRequest = {
  key: string;
  productId?: string;
  message?: string;
} | null;

type OrderSectionProps = {
  products: ProductRecord[];
  request: OrderRequest;
};

export function OrderSection({ products, request }: OrderSectionProps) {
  const requestedProduct = request?.productId
    ? products.find((item) => item.id === request.productId)
    : undefined;
  const submissionInFlight = useRef(false);
  const [submissionId, setSubmissionId] = useState(() => crypto.randomUUID());
  const [selectedProductId, setSelectedProductId] = useState(requestedProduct?.id ?? "");
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateApplicationInput>({
    resolver: zodResolver(createApplicationSchema),
    defaultValues: {
      ...initialValues,
      message:
        request?.message ??
        (requestedProduct ? `Интересует продукт: ${requestedProduct.name}.` : ""),
    },
  });

  const sortedProducts = products.slice().sort((a, b) => a.sortOrder - b.sortOrder);

  const submitValues = useCallback(async (values: CreateApplicationInput) => {
    setServerError("");
    try {
      const query = new URLSearchParams(window.location.search);
      await api.applications.create({
        ...values,
        submissionId,
        visitorId: getVisitorId(),
        sourcePage: window.location.href,
        utmSource: query.get("utm_source") || undefined,
        utmMedium: query.get("utm_medium") || undefined,
        utmCampaign: query.get("utm_campaign") || undefined,
      });
      setSuccess(true);
      setSelectedProductId("");
      reset(initialValues);
      setSubmissionId(crypto.randomUUID());
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Не удалось отправить заявку");
    }
  }, [reset, submissionId]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    if (submissionInFlight.current) return;
    submissionInFlight.current = true;
    try {
      await handleSubmit(submitValues)(event);
    } finally {
      submissionInFlight.current = false;
    }
  };

  return (
        <section className="agro-order" id="order">
          <div className="agro-container agro-order__grid">
            <div className="agro-order__copy">
              <span className="agro-kicker">Заказ и доставка</span>
              <h2>Получите расчёт поставки под ваше хозяйство</h2>
              <p>
                Оставьте контакты. Специалист уточнит вид животных, возраст, необходимый объём и
                предложит подходящий продукт.
              </p>
              <div className="agro-order__conditions">
                <span>
                  <strong>от 25 кг</strong> доставка по регионам
                </span>
                <span>
                  <strong>от 100 кг</strong> бесплатно по Минску
                </span>
                <span>
                  <strong>−10%</strong> при самовывозе
                </span>
              </div>
            </div>
            <form className="agro-order__form" onSubmit={(event) => void submit(event)} noValidate>
              <div>
                <h3>Заполните ваши данные</h3>
                <p>Перезвоним в рабочее время и ответим на вопросы.</p>
              </div>
              <label>
                Ваше имя
                <input {...register("name")} autoComplete="name" placeholder="Ваше имя" />
                {errors.name && <small>{errors.name.message}</small>}
              </label>
              <label>
                Телефон
                <input
                  {...register("phone")}
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="Ваш телефон"
                />
                {errors.phone && <small>{errors.phone.message}</small>}
              </label>
              <label className="agro-order__optional">
                Email <span>(необязательно)</span>
                <input
                  {...register("email")}
                  autoComplete="email"
                  inputMode="email"
                  placeholder="name@company.by"
                />
                {errors.email && <small>{errors.email.message}</small>}
              </label>
              <label className="agro-order__optional">
                Интересующий продукт <span>(необязательно)</span>
                <select
                  value={selectedProductId}
                  onChange={(event) => {
                    const productId = event.target.value;
                    setSelectedProductId(productId);
                    const product = sortedProducts.find((item) => item.id === productId);
                    if (product) setValue("message", `Интересует продукт: ${product.name}.`);
                  }}
                >
                  <option value="">Нужна помощь с выбором</option>
                  {sortedProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="agro-order__optional">
                Комментарий
                <textarea
                  {...register("message")}
                  rows={3}
                  placeholder="Укажите вид животных, возраст и примерный объём"
                />
              </label>
              <input
                className="agro-honeypot"
                tabIndex={-1}
                autoComplete="off"
                {...register("website")}
              />
              <label className="agro-checkbox agro-order__optional">
                <input type="checkbox" defaultChecked {...register("consent")} />
                <span>
                  Я согласен на обработку персональных данных и принимаю{" "}
                  <Link href="/privacy">политику конфиденциальности</Link>.
                </span>
              </label>
              {serverError && (
                <p className="agro-form-message is-error" role="alert">
                  {serverError}
                </p>
              )}
              {success && (
                <p className="agro-form-message is-success" role="status">
                  Заявка принята. Мы свяжемся с вами в ближайшее рабочее время.
                </p>
              )}
              <button
                className="agro-btn agro-btn--primary agro-btn--full"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Отправляем…" : "Заказать"}
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </section>
  );
}
