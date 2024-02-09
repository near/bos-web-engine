import { NearIconSvg, Tooltip } from '@bos-web-engine/ui';
import {
  Plus,
  Code,
  Eye,
  BracketsCurly,
  BookOpenText,
  GitPullRequest,
  ArrowLeft,
  FileX,
} from '@phosphor-icons/react';

import { GitHubIconSvg } from './GitHubIconSvg';
import s from './SidebarActions.module.css';
import { useModifiedFiles } from '../hooks/useModifiedFiles';
import { useMonaco } from '../hooks/useMonaco';
import { useSandboxStore } from '../hooks/useSandboxStore';

export function SidebarActions() {
  const monaco = useMonaco();
  const editors = monaco?.editor.getEditors();
  const containerElement = useSandboxStore((store) => store.containerElement);
  const mode = useSandboxStore((store) => store.mode);
  const addNewFile = useSandboxStore((store) => store.addNewFile);
  const setMode = useSandboxStore((store) => store.setMode);
  const expandedEditPanel = useSandboxStore((store) => store.expandedEditPanel);
  const resetAllFiles = useSandboxStore((store) => store.resetAllFiles);
  const setExpandedEditPanel = useSandboxStore(
    (store) => store.setExpandedEditPanel
  );
  const { modifiedFilePaths } = useModifiedFiles();

  const addNewComponent = () => {
    addNewFile();
  };

  const formatCode = () => {
    const actionName = 'editor.action.formatDocument';

    editors?.forEach((editor) => {
      const action = editor?.getAction(actionName);

      if (!action) {
        console.warn(`Action not found ${actionName}`);
        return;
      }

      action.run();
    });
  };

  return (
    <div className={s.wrapper}>
      {mode === 'EDIT' && (
        <>
          <Tooltip
            content="Create new component"
            side="right"
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
            container={containerElement}
          >
            <button className={s.action} type="button" onClick={formatCode}>
              <BracketsCurly />
            </button>
          </Tooltip>

          <Tooltip
            content="Expand editor panel"
            side="right"
            container={containerElement}
          >
            <button
              className={s.action}
              type="button"
              onClick={() =>
                setExpandedEditPanel(
                  expandedEditPanel === 'SOURCE' ? undefined : 'SOURCE'
                )
              }
            >
              <Code />
            </button>
          </Tooltip>

          <Tooltip
            content="Expand preview panel"
            side="right"
            container={containerElement}
          >
            <button
              className={s.action}
              type="button"
              onClick={() =>
                setExpandedEditPanel(
                  expandedEditPanel === 'PREVIEW' ? undefined : 'PREVIEW'
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

      <Tooltip content="Sandbox Docs" side="right" container={containerElement}>
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
        container={containerElement}
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
        content="Delete all local components and reinitialize examples"
        side="right"
        container={containerElement}
      >
        <button className={s.action} type="button" onClick={resetAllFiles}>
          <FileX />
        </button>
      </Tooltip>

      <Tooltip
        content="Powered by NEAR"
        side="right"
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
