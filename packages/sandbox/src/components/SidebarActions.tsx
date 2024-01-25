import { NearIconSvg, Tooltip } from '@bos-web-engine/ui';
import { useMonaco } from '@monaco-editor/react';
import {
  Plus,
  Code,
  Eye,
  BracketsCurly,
  BookOpenText,
  GitPullRequest,
  ArrowLeft,
} from '@phosphor-icons/react';

import { GitHubIconSvg } from './GitHubIconSvg';
import s from './SidebarActions.module.css';
import { NEW_COMPONENT_TEMPLATE } from '../constants';
import { useModifiedFiles } from '../hooks/useModifiedFiles';
import { useSandboxStore } from '../hooks/useSandboxStore';
import { PanelType } from '../types';
import { returnUniqueFilePath } from '../utils';

type Props = {
  expandedPanel: PanelType | null;
  onSelectExpandPanel: (panel: PanelType | null) => void;
};

export function SidebarActions({ expandedPanel, onSelectExpandPanel }: Props) {
  const monaco = useMonaco();
  const editors = monaco?.editor.getEditors();
  const editor = editors && editors[Math.max(editors.length - 1, 0)];
  const containerElement = useSandboxStore((store) => store.containerElement);
  const files = useSandboxStore((store) => store.files);
  const mode = useSandboxStore((store) => store.mode);
  const setActiveFile = useSandboxStore((store) => store.setActiveFile);
  const setEditingFileName = useSandboxStore(
    (store) => store.setEditingFileName
  );
  const setFile = useSandboxStore((store) => store.setFile);
  const setMode = useSandboxStore((store) => store.setMode);
  const { modifiedFilePaths } = useModifiedFiles();

  const addNewComponent = () => {
    const filePath = returnUniqueFilePath(files, 'Untitled', 'tsx');
    setFile(filePath, {
      source: NEW_COMPONENT_TEMPLATE.source,
    });
    setActiveFile(filePath);
    setEditingFileName(filePath);
  };

  const formatCode = () => {
    const actionName = 'editor.action.formatDocument';
    const action = editor?.getAction(actionName);

    if (!action) {
      console.warn(`Action not found ${actionName}`);
      return;
    }

    action.run();
  };

  return (
    <div className={s.wrapper}>
      {mode === 'EDIT' && (
        <>
          <Tooltip
            content="Create new component"
            side="right"
            sideOffset={10}
            container={containerElement}
          >
            <button
              className={s.action}
              type="button"
              onClick={addNewComponent}
            >
              <Plus />
            </button>
          </Tooltip>

          <Tooltip
            content="Format code"
            side="right"
            sideOffset={10}
            container={containerElement}
          >
            <button className={s.action} type="button" onClick={formatCode}>
              <BracketsCurly />
            </button>
          </Tooltip>

          <Tooltip
            content="Expand editor panel"
            side="right"
            sideOffset={10}
            container={containerElement}
          >
            <button
              className={s.action}
              type="button"
              onClick={() =>
                onSelectExpandPanel(
                  expandedPanel === 'EDITOR' ? null : 'EDITOR'
                )
              }
            >
              <Code />
            </button>
          </Tooltip>

          <Tooltip
            content="Expand preview panel"
            side="right"
            sideOffset={10}
            container={containerElement}
          >
            <button
              className={s.action}
              type="button"
              onClick={() =>
                onSelectExpandPanel(
                  expandedPanel === 'PREVIEW' ? null : 'PREVIEW'
                )
              }
            >
              <Eye />
            </button>
          </Tooltip>

          <Tooltip
            content={
              modifiedFilePaths.length > 0
                ? `Review and publish changes: ${modifiedFilePaths.length}`
                : 'No changes to publish'
            }
            side="right"
            sideOffset={10}
            container={containerElement}
          >
            <button
              className={s.action}
              type="button"
              onClick={() => setMode('PUBLISH')}
            >
              {modifiedFilePaths.length > 0 && (
                <span className={s.actionBadge}>
                  {modifiedFilePaths.length}
                </span>
              )}
              <GitPullRequest />
            </button>
          </Tooltip>
        </>
      )}

      {mode === 'PUBLISH' && (
        <>
          <Tooltip
            content="Back to editor"
            side="right"
            sideOffset={10}
            container={containerElement}
          >
            <button
              className={s.action}
              type="button"
              onClick={() => setMode('EDIT')}
            >
              <ArrowLeft />
            </button>
          </Tooltip>
        </>
      )}

      <Tooltip
        content="Sandbox Docs"
        side="right"
        sideOffset={10}
        container={containerElement}
      >
        <a
          className={s.action}
          style={{ marginTop: 'auto' }}
          href="/help"
          target="_blank"
        >
          <BookOpenText />
        </a>
      </Tooltip>

      <Tooltip
        content="View this project on GitHub"
        side="right"
        sideOffset={10}
      >
        <a
          className={s.action}
          href="https://github.com/near/bos-web-engine"
          target="_blank"
          rel="noreferrer"
        >
          <GitHubIconSvg />
        </a>
      </Tooltip>

      <Tooltip
        content="Powered by NEAR"
        side="right"
        sideOffset={10}
        container={containerElement}
      >
        <a
          className={s.action}
          href="https://near.org"
          target="_blank"
          rel="noreferrer"
        >
          <NearIconSvg />
        </a>
      </Tooltip>
    </div>
  );
}
