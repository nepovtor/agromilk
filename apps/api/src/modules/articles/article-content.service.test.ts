import { describe, expect, it } from "vitest";
import {
  articleContentMediaUrls,
  hasInvalidArticleEmbed,
  sanitizeArticleContent,
} from "./article-content.service.js";

describe("sanitizeArticleContent", () => {
  it("keeps editable table structure and removes unsafe attributes", () => {
    const content = sanitizeArticleContent(
      '<div class="tableWrapper"><table style="width: 420px; background-image: url(javascript:alert(1))" onclick="alert(1)"><colgroup><col style="width: 140px" width="140"></colgroup><tbody><tr><th colspan="2" colwidth="140,140">Заголовок</th></tr><tr><td rowspan="2">Значение</td><td onmouseover="alert(1)">10</td></tr></tbody></table></div>',
    );

    expect(content).toContain('<div class="tableWrapper"><table style="width:420px">');
    expect(content).toContain('<col style="width:140px" width="140"');
    expect(content).toContain('<th colspan="2" colwidth="140,140">Заголовок</th>');
    expect(content).toContain('<td rowspan="2">Значение</td>');
    expect(content).not.toContain("onclick");
    expect(content).not.toContain("onmouseover");
    expect(content).not.toContain("background-image");
    expect(content).not.toContain("javascript:");
  });

  it("keeps safe text alignment only", () => {
    const content = sanitizeArticleContent(
      '<p style="text-align: center; position: fixed">По центру</p>',
    );

    expect(content).toBe('<p style="text-align:center">По центру</p>');
  });

  it("accepts only YouTube embeds and discovers unique uploaded media", () => {
    expect(
      hasInvalidArticleEmbed('<iframe src="https://www.youtube.com/embed/abcdefghijk"></iframe>'),
    ).toBe(false);
    expect(
      hasInvalidArticleEmbed('<iframe src="https://evil.example/embed/abcdefghijk"></iframe>'),
    ).toBe(true);
    expect(hasInvalidArticleEmbed("<iframe></iframe>")).toBe(true);
    expect(
      articleContentMediaUrls(
        '<img src="/uploads/a.webp"><img src="/uploads/a.webp"><img src="https://example.com/a.webp">',
      ),
    ).toEqual(["/uploads/a.webp"]);
  });
});
