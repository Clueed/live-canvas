"use client";

import { FixedToolbarPlugin } from "@/components/editor/plugins/fixed-toolbar-plugin";
import { BlockDiscussion } from "@/components/plate-ui/block-discussion";
import { SuggestionBelowNodes } from "@/components/plate-ui/suggestion-line-break";
import emojiMartData from "@emoji-mart/data";
import { DocxPlugin } from "@udecode/plate-docx";
import { EmojiPlugin } from "@udecode/plate-emoji/react";
import { HighlightPlugin } from "@udecode/plate-highlight/react";
import { HorizontalRulePlugin } from "@udecode/plate-horizontal-rule/react";
import { JuicePlugin } from "@udecode/plate-juice";
import { TrailingBlockPlugin } from "@udecode/plate-trailing-block";
import { autoformatPlugin } from "./autoformat-plugin";
import { basicNodesPlugins } from "./basic-nodes-plugins";
import { blockMenuPlugins } from "./block-menu-plugins";
import { commentsPlugin } from "./comments-plugin";
import { cursorOverlayPlugin } from "./cursor-overlay-plugin";
import { deletePlugins } from "./delete-plugins";
import { dndPlugins } from "./dnd-plugins";
import { exitBreakPlugin } from "./exit-break-plugin";
import { markdownPlugin } from "./markdown-plugin";
import { resetBlockTypePlugin } from "./reset-block-type-plugin";
import { skipMarkPlugin } from "./skip-mark-plugin";
import { softBreakPlugin } from "./soft-break-plugin";
import { suggestionPlugin } from "./suggestion-plugin";

export const viewPlugins = [
  ...basicNodesPlugins,
  HorizontalRulePlugin,
  // linkPlugin,
  // DatePlugin,
  // mentionPlugin,
  // tablePlugin,
  // TogglePlugin,
  // tocPlugin,
  // ...mediaPlugins,
  // ...equationPlugins,
  // CalloutPlugin,
  // ColumnPlugin,

  // Marks
  // FontColorPlugin,
  // FontBackgroundColorPlugin,
  // FontSizePlugin,
  HighlightPlugin,
  // KbdPlugin,
  skipMarkPlugin,

  // Block Style
  // alignPlugin,
  // ...indentListPlugins,
  // lineHeightPlugin,

  // Collaboration
  commentsPlugin.configure({
    render: { aboveNodes: BlockDiscussion as any },
  }),
  suggestionPlugin.configure({
    render: { belowNodes: SuggestionBelowNodes as any },
  }),
] as const;

export const editorPlugins = [
  // AI
  // ...aiPlugins,

  // Nodes
  ...viewPlugins,

  // Functionality
  // SlashPlugin.extend({
  //   options: {
  //     triggerQuery(editor) {
  //       return !editor.api.some({
  //         match: { type: editor.getType(CodeBlockPlugin) }
  //       });
  //     }
  //   }
  // }),
  autoformatPlugin,
  cursorOverlayPlugin,
  ...blockMenuPlugins,
  ...dndPlugins,
  EmojiPlugin.configure({ options: { data: emojiMartData as any } }),
  exitBreakPlugin,
  resetBlockTypePlugin,
  ...deletePlugins,
  softBreakPlugin,
  TrailingBlockPlugin,

  // Deserialization
  DocxPlugin,
  markdownPlugin,
  JuicePlugin,

  // UI
  FixedToolbarPlugin,
  // FloatingToolbarPlugin
];
