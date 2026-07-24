import sanitizeHtml from "sanitize-html";

const youtubeEmbedPattern = /^https:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/[A-Za-z0-9_-]{11}(?:\?.*)?$/;

export function hasInvalidArticleEmbed(content: string) {
  const iframePattern = /<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = iframePattern.exec(content))) {
    if (!youtubeEmbedPattern.test(match[1] ?? "")) return true;
  }
  return /<iframe\b/i.test(content) && !/<iframe\b[^>]*\bsrc\s*=/i.test(content);
}

export function sanitizeArticleContent(content: string) {
  return sanitizeHtml(content, {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      "img", "iframe", "figure", "figcaption", "h1", "h2", "h3", "h4", "s", "u"
    ],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      iframe: ["src", "width", "height", "allow", "allowfullscreen", "frameborder"],
      table: ["style"],
      col: ["width", "style"],
      td: ["colspan", "rowspan", "colwidth", "style"],
      th: ["colspan", "rowspan", "colwidth", "style"],
      p: ["style"],
      h1: ["style"],
      h2: ["style"],
      h3: ["style"],
      "*": ["class"]
    },
    allowedStyles: {
      table: {
        width: [/^\d+(?:\.\d+)?px$/],
        "min-width": [/^\d+(?:\.\d+)?px$/]
      },
      col: {
        width: [/^\d+(?:\.\d+)?px$/],
        "min-width": [/^\d+(?:\.\d+)?px$/]
      },
      td: { "text-align": [/^(?:left|center|right)$/] },
      th: { "text-align": [/^(?:left|center|right)$/] },
      p: { "text-align": [/^(?:left|center|right)$/] },
      h1: { "text-align": [/^(?:left|center|right)$/] },
      h2: { "text-align": [/^(?:left|center|right)$/] },
      h3: { "text-align": [/^(?:left|center|right)$/] }
    },
    allowedIframeHostnames: ["www.youtube.com", "www.youtube-nocookie.com"],
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }, true),
      img: sanitizeHtml.simpleTransform("img", { loading: "lazy" }, true)
    }
  });
}
