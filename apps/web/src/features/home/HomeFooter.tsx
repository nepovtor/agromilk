import { agromilkAsset as asset } from "@/lib/agromilkAssets";

export function HomeFooter() {
  return (
      <footer className="agro-footer">
        <div className="agro-container agro-footer__grid">
          <div>
            <img src={asset("logo-desktop.webp")} alt="Агромилк" />
            <p>Современные заменители цельного и обезжиренного молока.</p>
          </div>
          <section>
            <h2>Контакты</h2>
            <a href="tel:+375447442338">+375 44 744-23-38</a>
            <a href="tel:+375172703278">+375 17 270-32-78</a>
            <a href="mailto:fresh.vks@mail.ru">fresh.vks@mail.ru</a>
          </section>
          <section>
            <h2>Адрес</h2>
            <address>
              ООО «Свежесть вкуса»
              <br />
              г. Минск, Республика Беларусь
            </address>
          </section>
          <section>
            <h2>Время работы</h2>
            <span>Пн–Пт: 9:00–17:00</span>
            <span>Выходной: суббота, воскресенье</span>
          </section>
        </div>
        <div className="agro-container agro-footer__bottom">
          <span>© {new Date().getFullYear()} ООО «Свежесть вкуса»</span>
          <span>Информация на сайте не является публичной офертой.</span>
        </div>
      </footer>

  );
}
