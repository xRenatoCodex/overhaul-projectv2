"use client"

import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  headingsPlugin,
  InsertTable,
  InsertThematicBreak,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  MDXEditor,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
  type MDXEditorProps,
} from "@mdxeditor/editor"

import "@mdxeditor/editor/style.css"
import styles from "./markdown-editor.module.css"

export default function InitializedMarkdownEditor(props: MDXEditorProps) {
  const { contentEditableClassName, translation, ...editorProps } = props

  return (
    <MDXEditor
      {...editorProps}
      contentEditableClassName={[styles.editorContent, contentEditableClassName]
        .filter(Boolean)
        .join(" ")}
      translation={translation ?? translateEditor}
      plugins={[
        headingsPlugin({ allowedHeadingLevels: [1, 2, 3] }),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        tablePlugin(),
        markdownShortcutPlugin(),
        toolbarPlugin({
          toolbarContents: () => (
            <>
              <UndoRedo />
              <BlockTypeSelect />
              <BoldItalicUnderlineToggles />
              <CodeToggle />
              <ListsToggle />
              <CreateLink />
              <InsertTable />
              <InsertThematicBreak />
            </>
          ),
        }),
      ]}
    />
  )
}

function translateEditor(
  key: string,
  defaultValue: string,
  interpolations?: Record<string, unknown>
) {
  if (key === "toolbar.blockTypes.heading") {
    const headings: Record<string, string> = {
      "1": "Título",
      "2": "Subtítulo",
      "3": "Encabezado",
    }

    return headings[String(interpolations?.level)] ?? defaultValue
  }

  const translations: Record<string, string> = {
    "toolbar.blockTypes.paragraph": "Párrafo",
    "toolbar.blockTypes.quote": "Cita",
    "toolbar.blockTypeSelect.selectBlockTypeTooltip": "Tipo de texto",
    "toolbar.blockTypeSelect.placeholder": "Tipo de texto",
    "toolbar.bulletedList": "Lista con viñetas",
    "toolbar.numberedList": "Lista numerada",
    "toolbar.checkList": "Lista de tareas",
  }

  return translations[key] ?? defaultValue
}
