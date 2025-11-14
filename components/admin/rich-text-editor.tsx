"use client"

import { useTranslations } from "@/lib/i18n/use-translations"
import { useTheme as useAppTheme } from "@/lib/theme-provider"
import type { MediaFile } from "@/lib/types"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import Color from "@tiptap/extension-color"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import TextAlign from "@tiptap/extension-text-align"
import { TextStyle } from "@tiptap/extension-text-style"
import Underline from "@tiptap/extension-underline"
import StarterKit from "@tiptap/starter-kit"
import { FontSize, LinkBubbleMenu, LinkBubbleMenuHandler, MenuButtonAddImage, MenuButtonAlignCenter, MenuButtonAlignJustify, MenuButtonAlignLeft, MenuButtonAlignRight, MenuButtonBlockquote, MenuButtonBold, MenuButtonBulletedList, MenuButtonHorizontalRule, MenuButtonItalic, MenuButtonOrderedList, MenuButtonRedo, MenuButtonRemoveFormatting, MenuButtonStrikethrough, MenuButtonTextColor, MenuButtonUnderline, MenuButtonUndo, MenuControlsContainer, MenuDivider, MenuSelectFontSize, MenuSelectHeading, MenuSelectTextAlign, ResizableImage, RichTextEditor, type RichTextEditorRef } from "mui-tiptap"
import { useEffect, useMemo, useRef, useState } from "react"
import { MediaPickerDialog } from "./media-picker-dialog"

interface RichTextEditorFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

function convertToMuiColor(color: string): string {
  // If color is already in a supported format, return as-is
  const supportedFormats = ["#", "rgb", "rgba", "hsl", "hsla", "color("]
  const isSupported = supportedFormats.some((format) => color.trim().toLowerCase().startsWith(format))

  if (isSupported) {
    return color
  }

  // If it's oklch or another unsupported format, convert to rgb using canvas
  if (typeof window === "undefined") {
    return color
  }

  // Always try to convert using canvas (works for any CSS color format)
  try {
    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = 1
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.fillStyle = color
      ctx.fillRect(0, 0, 1, 1)
      const imageData = ctx.getImageData(0, 0, 1, 1)
      const [r, g, b, a] = imageData.data

      // Return rgba format
      if (a === 255) {
        return `rgb(${r}, ${g}, ${b})`
      } else {
        return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`
      }
    }
  } catch (error) {
    // If canvas conversion fails, try computed style as fallback
    try {
      const tempElement = document.createElement("div")
      tempElement.style.position = "absolute"
      tempElement.style.visibility = "hidden"
      tempElement.style.pointerEvents = "none"
      tempElement.style.color = color
      document.body.appendChild(tempElement)
      const computed = getComputedStyle(tempElement).color
      document.body.removeChild(tempElement)

      // Recursively convert if still unsupported
      if (computed && computed !== color) {
        return convertToMuiColor(computed)
      }
    } catch {
      // Fall through
    }
  }

  // Last resort: return original (might cause error but better than crashing)
  return color
}

function resolveCssVar(
  variableName: string,
  fallback: string,
  property: "color" | "backgroundColor" | "borderColor" = "color"
): string {
  if (typeof window === "undefined") {
    return fallback
  }

  const container = document.body ?? document.documentElement
  if (!container) return fallback

  const element = document.createElement("span")
  element.style.position = "absolute"
  element.style.pointerEvents = "none"
  element.style.opacity = "0"
  element.style.setProperty(property, `var(${variableName})`)
  container.appendChild(element)
  const computed = getComputedStyle(element)[property] || fallback
  element.remove()
  const color = typeof computed === "string" && computed.trim().length > 0 ? computed : fallback

  // Convert oklch to MUI-supported format
  return convertToMuiColor(color)
}

function resolveCssValue(variableName: string, fallback: string) {
  if (typeof window === "undefined") return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(variableName)?.trim()
  return value && value.length > 0 ? value : fallback
}

export function RichTextEditorField({ value, onChange, placeholder }: RichTextEditorFieldProps) {
  const { t } = useTranslations("admin")
  const { t: tCommon } = useTranslations("common")
  const { resolvedTheme } = useAppTheme()
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)
  const editorRef = useRef<RichTextEditorRef>(null)
  const isDarkMode = resolvedTheme === "dark"

  const extensions = useMemo(
    () => [
      Color.configure({ types: ["textStyle"] }),
      TextStyle,
      FontSize,
      StarterKit.configure({
        heading: false,
      }),
      Placeholder.configure({ placeholder: placeholder || t("postEditor.form.bodyPlaceholder") }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      LinkBubbleMenuHandler,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      ResizableImage.configure({
        allowBase64: false,
        inline: false,
        HTMLAttributes: {
          class: "mx-auto rounded-lg",
        },
      }),
    ],
    [placeholder, t]
  )

  useEffect(() => {
    const html = value || "<p></p>"
    if (editorRef.current?.editor && editorRef.current.editor.getHTML() !== html) {
      editorRef.current.editor.commands.setContent(html, { emitUpdate: false })
    }
  }, [value])

  const handleInsertImage = (file: MediaFile) => {
    const editor = editorRef.current?.editor
    if (!editor) return

    editor
      .chain()
      .focus()
      .setImage({
        src: file.url,
        alt: file.filename,
      })
      .run()
  }

  const handleToggleMediaDialog = (open: boolean) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[RichTextEditorField] handleToggleMediaDialog", { open })
    }
    setMediaPickerOpen(open)
  }

  const theme = useMemo(() => {
    const palettePrimary = resolveCssVar("--primary", isDarkMode ? "#93c5fd" : "#2563eb")
    const paletteSecondary = resolveCssVar("--secondary", isDarkMode ? "#c4b5fd" : "#4f46e5")
    const divider = resolveCssVar(
      "--editor-border-subtle",
      isDarkMode ? "rgba(148, 163, 184, 0.24)" : "rgba(15, 23, 42, 0.08)",
      "borderColor"
    )
    const paper = resolveCssVar("--card", isDarkMode ? "#111827" : "#ffffff", "backgroundColor")
    const backgroundDefault = resolveCssVar(
      "--background",
      isDarkMode ? "#0b1120" : "#f8fafc",
      "backgroundColor"
    )
    const textPrimary = resolveCssVar("--foreground", isDarkMode ? "#e2e8f0" : "#0f172a")
    const textSecondary = resolveCssVar(
      "--muted-foreground",
      isDarkMode ? "#cbd5f5" : "#475569"
    )
    const toolbarSelectedBg = resolveCssVar(
      "--editor-toolbar-button-hover-bg",
      isDarkMode ? "rgba(148, 163, 184, 0.16)" : "rgba(37, 99, 235, 0.1)",
      "backgroundColor"
    )
    const toolbarSelectedHoverBg = resolveCssVar(
      "--editor-toolbar-button-hover-bg",
      isDarkMode ? "rgba(148, 163, 184, 0.22)" : "rgba(37, 99, 235, 0.16)",
      "backgroundColor"
    )
    const shadow = resolveCssValue(
      "--editor-shadow",
      isDarkMode
        ? "0 18px 48px -28px rgba(3, 7, 18, 0.7)"
        : "0 22px 48px -28px rgba(15, 23, 42, 0.18)"
    )

    // Ensure all colors are converted to MUI-supported formats
    const safePalettePrimary = convertToMuiColor(palettePrimary)
    const safePaletteSecondary = convertToMuiColor(paletteSecondary)
    const safeDivider = convertToMuiColor(divider)
    const safePaper = convertToMuiColor(paper)
    const safeBackgroundDefault = convertToMuiColor(backgroundDefault)
    const safeTextPrimary = convertToMuiColor(textPrimary)
    const safeTextSecondary = convertToMuiColor(textSecondary)

    return createTheme({
      palette: {
        mode: isDarkMode ? "dark" : "light",
        primary: { main: safePalettePrimary },
        secondary: { main: safePaletteSecondary },
        background: {
          default: safeBackgroundDefault,
          paper: safePaper,
        },
        text: {
          primary: safeTextPrimary,
          secondary: safeTextSecondary,
        },
        divider: safeDivider,
      },
      typography: {
        fontFamily: "var(--font-sans, Inter, Roboto, sans-serif)",
      },
      components: {
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: "none",
              backgroundColor: safePaper,
              color: safeTextPrimary,
              borderRadius: 12,
              border: `1px solid ${safeDivider}`,
              boxShadow: shadow,
            },
          },
        },
        MuiMenuItem: {
          styleOverrides: {
            root: {
              borderRadius: 8,
              "&.Mui-selected": {
                backgroundColor: convertToMuiColor(toolbarSelectedBg),
              },
              "&.Mui-selected:hover": {
                backgroundColor: convertToMuiColor(toolbarSelectedHoverBg),
              },
            },
          },
        },
        MuiListSubheader: {
          styleOverrides: {
            root: {
              backgroundColor: safePaper,
              color: safeTextSecondary,
            },
          },
        },
      },
    })
  }, [isDarkMode])

  return (
    <ThemeProvider theme={theme}>
      <div className="space-y-4">
        <div className="editor-shell">
        <RichTextEditor
          ref={editorRef}
          extensions={extensions}
          content={value || "<p></p>"}
          immediatelyRender={false}
          className="editor-field-container"
          RichTextFieldProps={{
            variant: "standard",
            className: "editor-field",
            MenuBarProps: {
              disableSticky: true,
              className: "editor-toolbar-container",
              classes: {
                content: "editor-toolbar-content",
              },
            },
            RichTextContentProps: {
              disableDefaultStyles: true,
              className: "editor-content-wrapper",
            },
          }}
          editorProps={{
            attributes: {
              class: "editor-prosemirror focus:outline-none min-h-[320px]",
            },
          }}
          onUpdate={({ editor }) => {
            const html = editor.getHTML()
            onChange(html === "<p></p>" ? "" : html)
          }}
          renderControls={(editor) => (
            <MenuControlsContainer className="editor-toolbar-controls">
              <MenuButtonUndo tooltipLabel={t("postEditor.editor.controls.undo")} />
              <MenuButtonRedo tooltipLabel={t("postEditor.editor.controls.redo")} />
              <MenuDivider />
              <MenuSelectHeading
                labels={{
                  paragraph: t("postEditor.editor.headings.paragraph"),
                  heading1: t("postEditor.editor.headings.h1"),
                  heading2: t("postEditor.editor.headings.h2"),
                  heading3: t("postEditor.editor.headings.h3"),
                }}
              />
              <MenuSelectFontSize
                options={[
                  { label: t("postEditor.editor.fontSize.small"), value: "12px" },
                  { label: t("postEditor.editor.fontSize.default"), value: "16px" },
                  { label: t("postEditor.editor.fontSize.medium"), value: "18px" },
                  { label: t("postEditor.editor.fontSize.large"), value: "20px" },
                  { label: t("postEditor.editor.fontSize.xl"), value: "24px" },
                  { label: t("postEditor.editor.fontSize.display"), value: "32px" },
                ]}
              />
              <MenuDivider />
              <MenuButtonBold tooltipLabel={t("postEditor.editor.controls.bold")} />
              <MenuButtonItalic tooltipLabel={t("postEditor.editor.controls.italic")} />
              <MenuButtonUnderline tooltipLabel={t("postEditor.editor.controls.underline")} />
              <MenuButtonStrikethrough tooltipLabel={t("postEditor.editor.controls.strike")} />
              <MenuButtonTextColor
                tooltipLabel={t("postEditor.editor.controls.textColor")}
                swatchColors={["#111827", "#991b1b", "#0369a1", "#f59e0b", "#16a34a", "#9333ea"]}
              />
              <MenuDivider />
              <MenuButtonBulletedList tooltipLabel={t("postEditor.editor.controls.bulletList")} />
              <MenuButtonOrderedList tooltipLabel={t("postEditor.editor.controls.numberList")} />
              <MenuDivider />
              <MenuButtonAlignLeft tooltipLabel={t("postEditor.editor.controls.alignLeft")} />
              <MenuButtonAlignCenter tooltipLabel={t("postEditor.editor.controls.alignCenter")} />
              <MenuButtonAlignRight tooltipLabel={t("postEditor.editor.controls.alignRight")} />
              <MenuButtonAlignJustify tooltipLabel={t("postEditor.editor.controls.alignJustify")} />
              <MenuSelectTextAlign />
              <MenuDivider />
              <MenuButtonBlockquote tooltipLabel={t("postEditor.editor.controls.blockquote")} />
              <MenuButtonHorizontalRule tooltipLabel={t("postEditor.editor.controls.horizontalRule")} />
              <MenuDivider />
              <MenuButtonRemoveFormatting tooltipLabel={t("postEditor.editor.controls.clearFormatting")} />
              <MenuDivider />
              <MenuButtonAddImage
                tooltipLabel={t("postEditor.editor.controls.addImage")}
                onClick={() => {
                  if (!editor) return
                  if (process.env.NODE_ENV !== "production") {
                    console.debug("[RichTextEditorField] MenuButtonAddImage clicked")
                  }
                  setMediaPickerOpen(true)
                }}
              />
            </MenuControlsContainer>
          )}
        >
          {(editor) =>
            editor ? (
              <LinkBubbleMenu
                labels={{
                  viewLinkEditButtonLabel: t("postEditor.editor.links.edit"),
                  viewLinkRemoveButtonLabel: t("postEditor.editor.links.remove"),
                  editLinkAddTitle: t("postEditor.editor.links.add"),
                  editLinkEditTitle: t("postEditor.editor.links.edit"),
                  editLinkTextInputLabel: "Link text",
                  editLinkHrefInputLabel: t("postEditor.editor.links.url"),
                  editLinkCancelButtonLabel: tCommon("cancel"),
                  editLinkSaveButtonLabel: tCommon("save"),
                }}
              />
            ) : null
          }
        </RichTextEditor>

        </div>
        <p className="text-xs text-muted-foreground">{t("postEditor.form.bodyHelpText")}</p>
      </div>

      <MediaPickerDialog
        open={mediaPickerOpen}
        onOpenChange={handleToggleMediaDialog}
        onSelect={(file) => {
          handleInsertImage(file)
        }}
      />
    </ThemeProvider>
  )
}
