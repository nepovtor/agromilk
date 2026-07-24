import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  EditorContent,
  Extension,
  mergeAttributes,
  Node as TiptapNode,
  useEditor,
  type Editor,
} from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import Youtube from "@tiptap/extension-youtube";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  BetweenHorizontalEnd,
  BetweenHorizontalStart,
  BetweenVerticalEnd,
  BetweenVerticalStart,
  Bold,
  ChevronDown,
  Columns3,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Merge,
  PanelTop,
  Plus,
  Quote,
  Rows3,
  SplitSquareVertical,
  Strikethrough,
  Table2,
  Trash2,
  UnderlineIcon,
  X,
} from "lucide-react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

type UploadRequest = { file: File; position: number };

const UploadingImage = TiptapNode.create({
  name: "uploadingImage",
  group: "block",
  atom: true,
  draggable: false,
  selectable: false,
  addAttributes() {
    return { uploadId: { default: null } };
  },
  parseHTML() {
    return [{ tag: "div[data-uploading-image]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-uploading-image": "",
        class: "editor-image-upload",
        contenteditable: "false",
      }),
      ["span", { class: "editor-image-upload__spinner" }],
      ["span", {}, "Загружаем изображение…"],
    ];
  },
});

const TextAlignment = Extension.create({
  name: "textAlignment",
  addGlobalAttributes() {
    return [
      {
        types: ["heading", "paragraph"],
        attributes: {
          textAlign: {
            default: "left",
            parseHTML: (element: HTMLElement) =>
              element.style.textAlign || "left",
            renderHTML: (attributes: Record<string, unknown>) =>
              attributes.textAlign && attributes.textAlign !== "left"
                ? { style: `text-align: ${String(attributes.textAlign)}` }
                : {},
          },
        },
      },
    ];
  },
});

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadPositionRef = useRef<number | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const [dragging, setDragging] = useState(false);
  const [insertMenuOpen, setInsertMenuOpen] = useState(false);
  const [inTable, setInTable] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const uploadImage = useCallback(async ({ file, position }: UploadRequest) => {
    const currentEditor = editorRef.current;
    if (
      !currentEditor ||
      currentEditor.isDestroyed ||
      !file.type.startsWith("image/")
    )
      return;

    const uploadId = crypto.randomUUID();
    currentEditor
      .chain()
      .focus()
      .insertContentAt(position, {
        type: "uploadingImage",
        attrs: { uploadId },
      })
      .run();

    try {
      const result = await api.media.upload(file);
      replaceUploadNode(currentEditor, uploadId, {
        type: "image",
        attrs: { src: result.url, alt: file.name, title: null },
      });
      setUploadError("");
    } catch (error) {
      replaceUploadNode(currentEditor, uploadId, null);
      setUploadError(
        error instanceof Error
          ? error.message
          : "Не удалось загрузить изображение",
      );
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      TextAlignment,
      Image.configure({
        allowBase64: false,
        HTMLAttributes: { loading: "lazy" },
      }),
      TableKit.configure({
        table: {
          resizable: true,
          renderWrapper: true,
          lastColumnResizable: true,
        },
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
        modestBranding: true,
      }),
      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === "heading"
            ? "Заголовок"
            : "Начните писать или нажмите «+»…",
      }),
      UploadingImage,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "prose editor-prose max-w-none",
        "aria-label": "Текст статьи",
      },
      transformPastedHTML: sanitizePastedHtml,
      handlePaste: (view, event) => {
        const image = getImageFiles(event.clipboardData?.files)[0];
        if (image) {
          event.preventDefault();
          void uploadImage({
            file: image,
            position: view.state.selection.from,
          });
          return true;
        }

        const text = event.clipboardData?.getData("text/plain").trim();
        if (text && isAllowedYoutubeUrl(text) && view.state.selection.empty) {
          event.preventDefault();
          editorRef.current?.commands.setYoutubeVideo({
            src: text,
            width: 800,
            height: 450,
          });
          return true;
        }
        return false;
      },
      handleDrop: (view, event) => {
        const image = getImageFiles(event.dataTransfer?.files)[0];
        if (!image) return false;
        event.preventDefault();
        setDragging(false);
        const position = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        })?.pos;
        void uploadImage({
          file: image,
          position: position ?? view.state.selection.from,
        });
        return true;
      },
    },
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
  });

  useEffect(() => {
    editorRef.current = editor;
    return () => {
      if (editorRef.current === editor) editorRef.current = null;
    };
  }, [editor]);

  useEffect(() => {
    if (editor && !editor.isDestroyed && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const updateTableState = () =>
      setInTable(!editor.isDestroyed && editor.isActive("table"));
    updateTableState();
    editor.on("selectionUpdate", updateTableState);
    editor.on("transaction", updateTableState);
    return () => {
      editor.off("selectionUpdate", updateTableState);
      editor.off("transaction", updateTableState);
    };
  }, [editor]);

  if (!editor) return null;

  const chooseImage = () => {
    if (editor.isDestroyed) return;
    uploadPositionRef.current = editor.state.selection.from;
    setInsertMenuOpen(false);
    fileRef.current?.click();
  };

  const insertLink = () => {
    if (editor.isDestroyed) return;
    const current = editor.getAttributes("link").href as string | undefined;
    const input = window.prompt("Введите адрес ссылки", current ?? "https://");
    if (input === null) return;
    if (!input.trim())
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: normalizeLink(input) })
        .run();
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-[var(--border)] bg-white shadow-sm transition-shadow focus-within:border-violet-300 focus-within:shadow-md",
        dragging && "border-violet-400 ring-4 ring-violet-100",
      )}
      onDragEnter={(event) =>
        event.dataTransfer.types.includes("Files") && setDragging(true)
      }
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setDragging(false);
      }}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes("Files")) event.preventDefault();
      }}
    >
      <BubbleMenu
        editor={editor}
        options={{ placement: "top", offset: 8 }}
        shouldShow={({ editor: current }) =>
          !current.state.selection.empty &&
          current.isEditable &&
          !current.isActive("table")
        }
      >
        <div
          className="max-w-[calc(100vw-2rem)] overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
          onMouseDown={(event) => event.preventDefault()}
        >
          <div className="flex min-w-max items-center gap-0.5">
            <MenuButton
              label="Жирный"
              active={editor.isActive("bold")}
              onClick={() =>
                runEditorAction(editor, () =>
                  editor.chain().focus().toggleBold().run(),
                )
              }
            >
              <Bold />
            </MenuButton>
            <MenuButton
              label="Курсив"
              active={editor.isActive("italic")}
              onClick={() =>
                runEditorAction(editor, () =>
                  editor.chain().focus().toggleItalic().run(),
                )
              }
            >
              <Italic />
            </MenuButton>
            <MenuButton
              label="Подчёркнутый"
              active={editor.isActive("underline")}
              onClick={() =>
                runEditorAction(editor, () =>
                  editor.chain().focus().toggleUnderline().run(),
                )
              }
            >
              <UnderlineIcon />
            </MenuButton>
            <MenuButton
              label="Зачёркнутый"
              active={editor.isActive("strike")}
              onClick={() =>
                runEditorAction(editor, () =>
                  editor.chain().focus().toggleStrike().run(),
                )
              }
            >
              <Strikethrough />
            </MenuButton>
            <span className="mx-1 h-5 w-px bg-slate-200" />
            <MenuButton
              label="Ссылка"
              active={editor.isActive("link")}
              onClick={insertLink}
            >
              <Link2 />
            </MenuButton>
            <span className="mx-1 h-5 w-px bg-slate-200" />
            <MenuButton
              label="По левому краю"
              active={editor.isActive({ textAlign: "left" })}
              onClick={() =>
                runEditorAction(editor, () => setAlignment(editor, "left"))
              }
            >
              <AlignLeft />
            </MenuButton>
            <MenuButton
              label="По центру"
              active={editor.isActive({ textAlign: "center" })}
              onClick={() =>
                runEditorAction(editor, () => setAlignment(editor, "center"))
              }
            >
              <AlignCenter />
            </MenuButton>
            <MenuButton
              label="По правому краю"
              active={editor.isActive({ textAlign: "right" })}
              onClick={() =>
                runEditorAction(editor, () => setAlignment(editor, "right"))
              }
            >
              <AlignRight />
            </MenuButton>
          </div>
        </div>
      </BubbleMenu>

      <FloatingMenu
        editor={editor}
        options={{ placement: "left-start", offset: 8 }}
        shouldShow={({ editor: current }) =>
          current.isEditable &&
          current.isActive("paragraph") &&
          current.state.selection.empty &&
          current.state.selection.$from.parent.content.size === 0
        }
      >
        <div className="relative">
          <button
            type="button"
            className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
            aria-label="Добавить блок"
            aria-expanded={insertMenuOpen}
            onClick={() => setInsertMenuOpen((open) => !open)}
          >
            <Plus className="size-4" />
          </button>
          {insertMenuOpen && (
            <InsertMenu
              editor={editor}
              onImage={chooseImage}
              onClose={() => setInsertMenuOpen(false)}
            />
          )}
        </div>
      </FloatingMenu>

      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <p className="text-xs font-medium text-slate-500">
          Выделите текст для форматирования · «+» добавляет изображение, таблицу
          и другие блоки
        </p>
        <ChevronDown className="size-4 text-slate-300" aria-hidden="true" />
      </div>

      {inTable && <TableToolbar editor={editor} />}

      <EditorContent editor={editor} />

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file)
            void uploadImage({
              file,
              position:
                uploadPositionRef.current ?? editor.state.selection.from,
            });
          uploadPositionRef.current = null;
        }}
      />

      {uploadError && (
        <div
          className="mx-5 mb-4 flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          <span>{uploadError}</span>
          <button
            type="button"
            className="rounded p-1 hover:bg-red-100"
            onClick={() => setUploadError("")}
            aria-label="Закрыть"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center rounded-2xl bg-violet-50/90">
          <div className="rounded-xl border border-dashed border-violet-400 bg-white px-8 py-6 text-center shadow-lg">
            <ImagePlus className="mx-auto mb-2 size-6 text-violet-600" />
            <p className="text-sm font-semibold text-violet-800">
              Отпустите изображение здесь
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function InsertMenu({
  editor,
  onImage,
  onClose,
}: {
  editor: Editor;
  onImage: () => void;
  onClose: () => void;
}) {
  const items: Array<{
    label: string;
    hint: string;
    icon: ReactNode;
    action: () => void;
  }> = [
    {
      label: "Заголовок 1",
      hint: "Главный раздел",
      icon: <Heading1 />,
      action: () =>
        runEditorAction(editor, () =>
          editor.chain().focus().toggleHeading({ level: 1 }).run(),
        ),
    },
    {
      label: "Заголовок 2",
      hint: "Крупный раздел",
      icon: <Heading2 />,
      action: () =>
        runEditorAction(editor, () =>
          editor.chain().focus().toggleHeading({ level: 2 }).run(),
        ),
    },
    {
      label: "Заголовок 3",
      hint: "Подраздел",
      icon: <Heading3 />,
      action: () =>
        runEditorAction(editor, () =>
          editor.chain().focus().toggleHeading({ level: 3 }).run(),
        ),
    },
    {
      label: "Маркированный список",
      hint: "Простой список",
      icon: <List />,
      action: () =>
        runEditorAction(editor, () =>
          editor.chain().focus().toggleBulletList().run(),
        ),
    },
    {
      label: "Нумерованный список",
      hint: "Последовательные шаги",
      icon: <ListOrdered />,
      action: () =>
        runEditorAction(editor, () =>
          editor.chain().focus().toggleOrderedList().run(),
        ),
    },
    {
      label: "Изображение",
      hint: "JPG, PNG, WebP или GIF",
      icon: <ImagePlus />,
      action: onImage,
    },
    {
      label: "Таблица 3 × 3",
      hint: "Первую строку сделаем заголовками",
      icon: <Table2 />,
      action: () =>
        runEditorAction(editor, () =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run(),
        ),
    },
    {
      label: "Цитата",
      hint: "Выделенный фрагмент",
      icon: <Quote />,
      action: () =>
        runEditorAction(editor, () =>
          editor.chain().focus().toggleBlockquote().run(),
        ),
    },
    {
      label: "Блок кода",
      hint: "Форматированный код",
      icon: <Code2 />,
      action: () =>
        runEditorAction(editor, () =>
          editor.chain().focus().toggleCodeBlock().run(),
        ),
    },
  ];

  return (
    <div
      className="absolute left-0 top-10 z-50 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl"
      onMouseDown={(event) => event.preventDefault()}
    >
      <p className="px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        Добавить блок
      </p>
      <div className="max-h-80 overflow-y-auto">
        {items.map((item) => (
          <button
            type="button"
            key={item.label}
            className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-slate-50"
            onClick={() => {
              item.action();
              if (item.label !== "Изображение") onClose();
            }}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-md border border-slate-200 text-slate-600 [&>svg]:size-4">
              {item.icon}
            </span>
            <span>
              <span className="block text-sm font-medium text-slate-800">
                {item.label}
              </span>
              <span className="block text-xs text-slate-400">{item.hint}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TableToolbar({ editor }: { editor: Editor }) {
  return (
    <div
      className="overflow-x-auto border-b border-slate-100 bg-slate-50/80 px-3 py-2"
      onMouseDown={(event) => event.preventDefault()}
    >
      <div className="flex min-w-max items-center gap-1.5">
        <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <Table2 className="size-4 text-violet-600" />
          Таблица
        </span>
        <TableAction
          label="Строка выше"
          onClick={() =>
            runEditorAction(editor, () =>
              editor.chain().focus().addRowBefore().run(),
            )
          }
        >
          <BetweenHorizontalStart />
        </TableAction>
        <TableAction
          label="Строка ниже"
          onClick={() =>
            runEditorAction(editor, () =>
              editor.chain().focus().addRowAfter().run(),
            )
          }
        >
          <BetweenHorizontalEnd />
        </TableAction>
        <TableAction
          label="Удалить строку"
          onClick={() =>
            runEditorAction(editor, () =>
              editor.chain().focus().deleteRow().run(),
            )
          }
        >
          <Rows3 />
        </TableAction>
        <span className="mx-1 h-6 w-px bg-slate-200" />
        <TableAction
          label="Столбец слева"
          onClick={() =>
            runEditorAction(editor, () =>
              editor.chain().focus().addColumnBefore().run(),
            )
          }
        >
          <BetweenVerticalStart />
        </TableAction>
        <TableAction
          label="Столбец справа"
          onClick={() =>
            runEditorAction(editor, () =>
              editor.chain().focus().addColumnAfter().run(),
            )
          }
        >
          <BetweenVerticalEnd />
        </TableAction>
        <TableAction
          label="Удалить столбец"
          onClick={() =>
            runEditorAction(editor, () =>
              editor.chain().focus().deleteColumn().run(),
            )
          }
        >
          <Columns3 />
        </TableAction>
        <span className="mx-1 h-6 w-px bg-slate-200" />
        <TableAction
          label="Строка заголовков"
          onClick={() =>
            runEditorAction(editor, () =>
              editor.chain().focus().toggleHeaderRow().run(),
            )
          }
        >
          <PanelTop />
        </TableAction>
        <TableAction
          label="Объединить ячейки"
          onClick={() =>
            runEditorAction(editor, () =>
              editor.chain().focus().mergeCells().run(),
            )
          }
        >
          <Merge />
        </TableAction>
        <TableAction
          label="Разделить ячейку"
          onClick={() =>
            runEditorAction(editor, () =>
              editor.chain().focus().splitCell().run(),
            )
          }
        >
          <SplitSquareVertical />
        </TableAction>
        <span className="mx-1 h-6 w-px bg-slate-200" />
        <TableAction
          label="Удалить таблицу"
          danger
          onClick={() =>
            runEditorAction(editor, () =>
              editor.chain().focus().deleteTable().run(),
            )
          }
        >
          <Trash2 />
        </TableAction>
      </div>
    </div>
  );
}

function TableAction({
  children,
  label,
  danger,
  onClick,
}: {
  children: ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 shadow-sm transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 [&>svg]:size-3.5",
        danger &&
          "text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700",
      )}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}

function MenuButton({
  children,
  label,
  active,
  onClick,
}: {
  children: ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "size-8 rounded-lg [&>svg]:size-4",
        active && "bg-violet-100 text-violet-700",
      )}
    >
      {children}
    </Button>
  );
}

function replaceUploadNode(
  editor: Editor,
  uploadId: string,
  replacement: { type: "image"; attrs: Record<string, unknown> } | null,
) {
  if (editor.isDestroyed) return;
  let position: number | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (
      node.type.name === "uploadingImage" &&
      node.attrs.uploadId === uploadId
    ) {
      position = pos;
      return false;
    }
    return true;
  });
  if (position === null) return;
  const transaction = editor.state.tr;
  const node = editor.state.doc.nodeAt(position);
  if (!node) return;
  if (replacement) {
    transaction.replaceWith(
      position,
      position + node.nodeSize,
      editor.schema.nodes.image.create(replacement.attrs),
    );
  } else {
    transaction.delete(position, position + node.nodeSize);
  }
  editor.view.dispatch(transaction.scrollIntoView());
}

function setAlignment(editor: Editor, textAlign: "left" | "center" | "right") {
  const type = editor.isActive("heading") ? "heading" : "paragraph";
  editor.chain().focus().updateAttributes(type, { textAlign }).run();
}

function runEditorAction(editor: Editor, action: () => void) {
  if (!editor.isDestroyed) action();
}

function getImageFiles(files?: FileList | null) {
  return Array.from(files ?? []).filter((file) =>
    file.type.startsWith("image/"),
  );
}

function isAllowedYoutubeUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    return (
      url.protocol === "https:" &&
      [
        "youtube.com",
        "m.youtube.com",
        "youtu.be",
        "youtube-nocookie.com",
      ].includes(hostname)
    );
  } catch {
    return false;
  }
}

function normalizeLink(value: string) {
  const trimmed = value.trim();
  return /^(https?:|mailto:|tel:)/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
}

function sanitizePastedHtml(html: string) {
  const document = new DOMParser().parseFromString(html, "text/html");
  document
    .querySelectorAll("script,style,meta,link,title,xml,iframe,object,embed")
    .forEach((node) => node.remove());
  document.querySelectorAll("*").forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      if (
        name === "href" ||
        name === "src" ||
        name === "alt" ||
        name === "title"
      )
        continue;
      const tag = element.tagName.toLowerCase();
      const numericValue = /^\d+(?:,\d+)*$/.test(attribute.value);
      if (
        (tag === "td" || tag === "th") &&
        ["colspan", "rowspan", "colwidth"].includes(name) &&
        numericValue
      )
        continue;
      if (tag === "col" && name === "width" && /^\d+$/.test(attribute.value))
        continue;
      element.removeAttribute(attribute.name);
    }
  });
  document.body
    .querySelectorAll("o\\:p")
    .forEach((node) => node.replaceWith(...Array.from(node.childNodes)));
  return document.body.innerHTML;
}
