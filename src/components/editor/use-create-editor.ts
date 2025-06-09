"use client";
import { editorPlugins } from "@/components/editor/plugins/editor-plugins";
import { FixedToolbarPlugin } from "@/components/editor/plugins/fixed-toolbar-plugin";
import { BlockquoteElement } from "@/components/plate-ui/blockquote-element";
import { CodeBlockElement } from "@/components/plate-ui/code-block-element";
import { CodeLeaf } from "@/components/plate-ui/code-leaf";
import { CodeLineElement } from "@/components/plate-ui/code-line-element";
import { CodeSyntaxLeaf } from "@/components/plate-ui/code-syntax-leaf";
import { ColumnElement } from "@/components/plate-ui/column-element";
import { CommentLeaf } from "@/components/plate-ui/comment-leaf";
import { HeadingElement } from "@/components/plate-ui/heading-element";
import { HighlightLeaf } from "@/components/plate-ui/highlight-leaf";
import { HrElement } from "@/components/plate-ui/hr-element";
import { MediaPlaceholderElement } from "@/components/plate-ui/media-placeholder-element";
import { ParagraphElement } from "@/components/plate-ui/paragraph-element";
import { withPlaceholders } from "@/components/plate-ui/placeholder";
import { SuggestionLeaf } from "@/components/plate-ui/suggestion-leaf";
import { withProps } from "@udecode/cn";
import type { Value } from "@udecode/plate";
import {
  BoldPlugin,
  CodePlugin,
  ItalicPlugin,
  StrikethroughPlugin,
  SubscriptPlugin,
  SuperscriptPlugin,
  UnderlinePlugin,
} from "@udecode/plate-basic-marks/react";
import { BlockquotePlugin } from "@udecode/plate-block-quote/react";
import {
  CodeBlockPlugin,
  CodeLinePlugin,
  CodeSyntaxPlugin,
} from "@udecode/plate-code-block/react";
import { CommentsPlugin } from "@udecode/plate-comments/react";
import { HEADING_KEYS } from "@udecode/plate-heading";
import { HighlightPlugin } from "@udecode/plate-highlight/react";
import { HorizontalRulePlugin } from "@udecode/plate-horizontal-rule/react";
import { ColumnItemPlugin, } from "@udecode/plate-layout/react";
import {
  PlaceholderPlugin,
} from "@udecode/plate-media/react";
import { PlaywrightPlugin } from "@udecode/plate-playwright";
import { SuggestionPlugin } from "@udecode/plate-suggestion/react";
import {
  type CreatePlateEditorOptions,
  ParagraphPlugin,
  PlateLeaf,
  usePlateEditor,
} from "@udecode/plate/react";

export const viewComponents = {
  // [AudioPlugin.key]: MediaAudioElement,
  [BlockquotePlugin.key]: BlockquoteElement,
  [BoldPlugin.key]: withProps(PlateLeaf, { as: "strong" }),
  [CodeBlockPlugin.key]: CodeBlockElement,
  [CodeLinePlugin.key]: CodeLineElement,
  [CodePlugin.key]: CodeLeaf,
  [CodeSyntaxPlugin.key]: CodeSyntaxLeaf,
  [ColumnItemPlugin.key]: ColumnElement,
  // [ColumnPlugin.key]: ColumnGroupElement,
  [CommentsPlugin.key]: CommentLeaf,
  // [DatePlugin.key]: DateElement,
  // [EquationPlugin.key]: EquationElement,
  // [ExcalidrawPlugin.key]: ExcalidrawElement,
  // [FilePlugin.key]: MediaFileElement,
  [HEADING_KEYS.h1]: withProps(HeadingElement, { variant: "h1" }),
  [HEADING_KEYS.h2]: withProps(HeadingElement, { variant: "h2" }),
  [HEADING_KEYS.h3]: withProps(HeadingElement, { variant: "h3" }),
  [HEADING_KEYS.h4]: withProps(HeadingElement, { variant: "h4" }),
  [HEADING_KEYS.h5]: withProps(HeadingElement, { variant: "h5" }),
  [HEADING_KEYS.h6]: withProps(HeadingElement, { variant: "h6" }),
  [HighlightPlugin.key]: HighlightLeaf,
  [HorizontalRulePlugin.key]: HrElement,
  // [ImagePlugin.key]: ImageElement,
  // [InlineEquationPlugin.key]: InlineEquationElement,
  [ItalicPlugin.key]: withProps(PlateLeaf, { as: "em" }),
  // [KbdPlugin.key]: KbdLeaf,
  // [LinkPlugin.key]: LinkElement,
  // [MediaEmbedPlugin.key]: MediaEmbedElement,
  // [MentionPlugin.key]: MentionElement,
  [ParagraphPlugin.key]: ParagraphElement,
  [PlaceholderPlugin.key]: MediaPlaceholderElement,
  [StrikethroughPlugin.key]: withProps(PlateLeaf, { as: "s" }),
  [SubscriptPlugin.key]: withProps(PlateLeaf, { as: "sub" }),
  [SuggestionPlugin.key]: SuggestionLeaf,
  [SuperscriptPlugin.key]: withProps(PlateLeaf, { as: "sup" }),
  // [TableCellHeaderPlugin.key]: TableCellHeaderElement,
  // [TableCellPlugin.key]: TableCellElement,
  // [TablePlugin.key]: TableElement,
  // [TableRowPlugin.key]: TableRowElement,
  // [TocPlugin.key]: TocElement,
  // [TogglePlugin.key]: ToggleElement,
  [UnderlinePlugin.key]: withProps(PlateLeaf, { as: "u" }),
  // [VideoPlugin.key]: MediaVideoElement
};

export const editorComponents = {
  ...viewComponents,
  // [AIPlugin.key]: AILeaf,
  // [EmojiInputPlugin.key]: EmojiInputElement,
  // [MentionInputPlugin.key]: MentionInputElement,
  // [SlashInputPlugin.key]: SlashInputElement
};

export const useCreateEditor = (
  {
    components,
    override,
    readOnly,
    ...options
  }: {
    components?: Record<string, any>;
    plugins?: any[];
    readOnly?: boolean;
  } & Omit<CreatePlateEditorOptions, "plugins"> = {},
  deps: any[] = [],
) => {
  return usePlateEditor<Value>(
    {
      override: {
        components: {
          ...(readOnly ? viewComponents : withPlaceholders(editorComponents)),
          ...components,
        },
        ...override,
      },
      plugins: [
        // ...copilotPlugins,
        ...editorPlugins,
        FixedToolbarPlugin,
        // FloatingToolbarPlugin,
        PlaywrightPlugin.configure({ enabled: process.env.NODE_ENV !== "production" }),
      ],
      value: [
  {
    "children": [
      {
        "text": "Playground",
        "suggestion": true,
        "suggestion_duwfENJzMsdD8ZiiAOroa": {
          "id": "duwfENJzMsdD8ZiiAOroa",
          "createdAt": 1749459602431,
          "type": "remove",
          "userId": "user3"
        }
      },
      {
        "suggestion_duwfENJzMsdD8ZiiAOroa": {
          "id": "duwfENJzMsdD8ZiiAOroa",
          "createdAt": 1749459602431,
          "type": "insert",
          "userId": "user3"
        },
        "suggestion": true,
        "text": "aoe"
      }
    ],
    "type": "h1",
    "id": "9kTNbSzp67"
  },
  {
    "children": [
      {
        "text": "A rich-text editor with AI capabilities. Try the "
      },
      {
        "bold": true,
        "text": "AI commands"
      },
      {
        "text": " or use Cmd+J to open the AI menu."
      }
    ],
    "type": "p",
    "id": "6mgM_R9ijX"
  }
],
      ...options,
    },
    deps,
  );
};
