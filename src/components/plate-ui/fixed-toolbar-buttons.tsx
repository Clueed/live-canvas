"use client";
import { useEditorReadOnly } from "@udecode/plate/react";
import { CommentToolbarButton } from "./comment-toolbar-button";
import { ExportToolbarButton } from "./export-toolbar-button";
import { RedoToolbarButton, UndoToolbarButton } from "./history-toolbar-button";
import { ImportToolbarButton } from "./import-toolbar-button";
import { ToolbarGroup } from "./toolbar";
import {
  ArrowUpToLineIcon,
} from "lucide-react";

export function FixedToolbarButtons() {
  const readOnly = useEditorReadOnly();

  return (
    <div className="flex w-full">
      {!readOnly && (
        <>
          <ToolbarGroup>
            <UndoToolbarButton />
            <RedoToolbarButton />
          </ToolbarGroup>
          {/* 
          <ToolbarGroup>
            <AIToolbarButton tooltip="AI commands">
              <WandSparklesIcon />
            </AIToolbarButton>
          </ToolbarGroup> */}

          <ToolbarGroup>
            <ExportToolbarButton>
              <ArrowUpToLineIcon />
            </ExportToolbarButton>

            <ImportToolbarButton />
          </ToolbarGroup>
          {/* 
          <ToolbarGroup>
            <InsertDropdownMenu />
            <TurnIntoDropdownMenu />
            <FontSizeToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <MarkToolbarButton nodeType={BoldPlugin.key} tooltip='Bold (⌘+B)'>
              <BoldIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={ItalicPlugin.key} tooltip='Italic (⌘+I)'>
              <ItalicIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={UnderlinePlugin.key} tooltip='Underline (⌘+U)'>
              <UnderlineIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={StrikethroughPlugin.key} tooltip='Strikethrough (⌘+⇧+M)'>
              <StrikethroughIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={CodePlugin.key} tooltip='Code (⌘+E)'>
              <Code2Icon />
            </MarkToolbarButton>

            <ColorDropdownMenu nodeType={FontColorPlugin.key} tooltip='Text color'>
              <BaselineIcon />
            </ColorDropdownMenu>

            <ColorDropdownMenu nodeType={FontBackgroundColorPlugin.key} tooltip='Background color'>
              <PaintBucketIcon />
            </ColorDropdownMenu>
          </ToolbarGroup>

          <ToolbarGroup>
            <AlignDropdownMenu />

            <NumberedIndentListToolbarButton />
            <BulletedIndentListToolbarButton />
            <IndentTodoToolbarButton />
            <ToggleToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <LinkToolbarButton />
            <TableDropdownMenu />
            <EmojiDropdownMenu />
          </ToolbarGroup>

          <ToolbarGroup>
            <MediaToolbarButton nodeType={ImagePlugin.key} />
            <MediaToolbarButton nodeType={VideoPlugin.key} />
            <MediaToolbarButton nodeType={AudioPlugin.key} />
            <MediaToolbarButton nodeType={FilePlugin.key} />
          </ToolbarGroup>

          <ToolbarGroup>
            <LineHeightDropdownMenu />
            <OutdentToolbarButton />
            <IndentToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <MoreDropdownMenu />
          </ToolbarGroup> */}
        </>
      )}

      <div className="grow" />

      {/* <ToolbarGroup>
        <MarkToolbarButton nodeType={HighlightPlugin.key} tooltip='Highlight'>
          <HighlighterIcon />
        </MarkToolbarButton>
        </ToolbarGroup> */}
      <CommentToolbarButton />

      {/* <ToolbarGroup>
        <ModeDropdownMenu />
      </ToolbarGroup> */}
    </div>
  );
}
