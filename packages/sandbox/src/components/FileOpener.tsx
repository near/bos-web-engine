import { useSocial } from '@bos-web-engine/social-db-api';
import { Dialog, HR, Input, Text } from '@bos-web-engine/ui';
import { useWallet } from '@bos-web-engine/wallet-selector-control';
import { KeyboardEventHandler, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import s from './FileOpener.module.css';
import { fetchPublishedFiles } from '../helpers/fetch-published-files';
import { useDebouncedFunction } from '../hooks/useDebounced';
import { SandboxFiles, useSandboxStore } from '../hooks/useSandboxStore';
import { convertFilePathToComponentName, returnUniqueFilePath } from '../utils';

type Props = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => any;
};

export function FileOpener(props: Props) {
  const containerElement = useSandboxStore((store) => store.containerElement);

  useEffect(() => {
    function openDialog(event: KeyboardEvent) {
      if (event.key === 'p' && event.metaKey) {
        event.preventDefault();
        props.setIsOpen(true);
      }
    }

    window.addEventListener('keydown', openDialog);

    return () => {
      window.removeEventListener('keydown', openDialog);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Dialog.Root open={props.isOpen} onOpenChange={props.setIsOpen}>
      <Dialog.Portal container={containerElement}>
        <Dialog.Content anchor="top" size="m" hideCloseButton>
          <Root {...props} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Root({ setIsOpen }: Props) {
  const { account } = useWallet();
  const { social } = useSocial();
  const openedFiles = useSandboxStore((store) => store.files);
  const publishedFiles = useSandboxStore((store) => store.publishedFiles);
  const setFile = useSandboxStore((store) => store.setFile);
  const setActiveFile = useSandboxStore((store) => store.setActiveFile);
  const isInitializingPublishedFiles = useSandboxStore(
    (store) => store.isInitializingPublishedFiles
  );
  const [searchAccountId, setSearchAccountId] = useState('');
  const [searchComponentName, setSearchComponentName] = useState('');
  const [searchPath, setSearchPath] = useState('');
  const [fetchedFiles, setFetchedFiles] = useState<SandboxFiles>({});
  const [matchingFilePaths, setMatchingFilePaths] = useState<string[]>([]);
  const [isLoadingSearchResults, setIsLoadingSearchResults] = useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const lastFetchedComponentsAccountId = useRef('');
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const isLoading = isInitializingPublishedFiles || isLoadingSearchResults;
  const fetchedFilesCount = Object.keys(fetchedFiles).length;

  const fetchFilesDebounced = useDebouncedFunction(async () => {
    try {
      lastFetchedComponentsAccountId.current = searchAccountId;
      const files = await fetchPublishedFiles(social, searchAccountId);
      filterFiles(searchComponentName, files);
    } catch (error) {
    } finally {
      setIsLoadingSearchResults(false);
    }
  }, 300);

  const filterFiles = (componentName: string, files: SandboxFiles) => {
    const normalizedComponentName = componentName
      .toLowerCase()
      .replace(/[/.]/g, '');

    const paths = Object.keys(files);
    paths.sort();

    const matchingPaths = paths.filter((path) => {
      const normalizedPath = path.toLowerCase().replace(/[/.]/g, '');
      return (
        !normalizedComponentName ||
        normalizedPath.includes(normalizedComponentName)
      );
    });

    setFetchedFiles(files);
    setMatchingFilePaths(matchingPaths);
  };

  const search = async (path: string) => {
    const segments = path.trim().replace('near://', '').split('/');
    const accountId = segments.shift() ?? '';
    const componentName = segments.join('.');

    setSearchAccountId(accountId);
    setSearchComponentName(componentName);
    setSelectedFileIndex(0);

    if (!accountId) {
      filterFiles('', {});
      fetchFilesDebounced.cancel();
      return;
    }

    if (account && account.accountId === accountId) {
      // Search local and published files already in store for current account
      filterFiles(componentName, { ...publishedFiles, ...openedFiles });
      fetchFilesDebounced.cancel();
      setIsLoadingSearchResults(false);
    } else if (
      !!searchAccountId.trim() &&
      accountId !== lastFetchedComponentsAccountId.current
    ) {
      // Fetch components for account ID if it has changed
      setIsLoadingSearchResults(true);
      fetchFilesDebounced();
    } else {
      // Filter already fetched files
      filterFiles(componentName, fetchedFiles);
    }
  };

  const openFile = (path: string) => {
    const file = fetchedFiles[path];
    if (!file) return;

    if (account && account.accountId === searchAccountId) {
      if (!openedFiles[path]) {
        setFile(path, file);
      }
      setActiveFile(path);
    } else {
      /*
        When opening an external component from a different author (forking), 
        we try to avoid path collisions with components written by the current 
        user (local and published).
      */
      const name = convertFilePathToComponentName(path);
      const uniquePath = returnUniqueFilePath(
        { ...publishedFiles, ...openedFiles },
        name,
        'tsx'
      );
      setFile(uniquePath, file);
      setActiveFile(uniquePath);
    }

    setIsOpen(false);
  };

  const onKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    let shouldOpenFile = false;

    flushSync(() => {
      if (
        event.key === 'ArrowDown' ||
        (event.key === 'Tab' && !event.shiftKey)
      ) {
        event.preventDefault();
        setSelectedFileIndex((index) => {
          if (index + 1 >= matchingFilePaths.length) {
            return 0;
          }
          return index + 1;
        });
      } else if (
        event.key === 'ArrowUp' ||
        (event.key === 'Tab' && event.shiftKey)
      ) {
        event.preventDefault();
        setSelectedFileIndex((index) => {
          if (index <= 0) {
            return matchingFilePaths.length - 1;
          }
          return index - 1;
        });
      } else if (event.key === 'Enter') {
        event.preventDefault();
        shouldOpenFile = true;
      }
    });

    const selected = wrapperRef.current?.querySelector(
      "[aria-selected='true']"
    );

    if (selected) {
      if (shouldOpenFile) {
        const path = selected.getAttribute('data-path');

        if (path) {
          openFile(path);
        }
      } else {
        selected.scrollIntoView({
          behavior: 'instant' as any, // Rollup TS complains this isn't a valid value even though it is...
          block: 'center',
        });
      }
    }
  };

  useEffect(() => {
    search(searchPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publishedFiles, searchPath]);

  useEffect(() => {
    if (account) {
      setSearchPath(`${account.accountId}/`);
    } else {
      setSearchPath('');
    }
  }, [account]);

  return (
    <>
      <Dialog.StickyHeader>
        <Input
          role="combobox"
          aria-controls="file-opener-list"
          loading={isLoading}
          placeholder="Search published components by path..."
          value={searchPath}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          onChange={(event) => setSearchPath(event.target.value)}
          onKeyDown={onKeyDown}
        />

        <Dialog.CloseButton tabIndex={-1} />
      </Dialog.StickyHeader>

      <div className={s.wrapper} ref={wrapperRef}>
        {matchingFilePaths.length > 0 ? (
          <ul
            className={s.fileList}
            id="file-opener-list"
            role="listbox"
            aria-label="Components"
          >
            {matchingFilePaths.map((path, index) => (
              <li
                className={s.fileListItem}
                aria-selected={index === selectedFileIndex}
                data-path={path}
                role="option"
                onClick={() => openFile(path)}
                key={path}
              >
                <span className={s.fileName}>{path}</span>
              </li>
            ))}
          </ul>
        ) : (
          <>
            {isLoading ? (
              <Text size="s">Loading...</Text>
            ) : (
              <>
                {searchAccountId && (
                  <>
                    {fetchedFilesCount > 0 ? (
                      <Text color="danger">
                        No published components match your search on account:{' '}
                        <b>{searchAccountId}</b>
                      </Text>
                    ) : (
                      <Text color="danger">
                        No published components found on account:{' '}
                        <b>{searchAccountId}</b>
                      </Text>
                    )}

                    <HR />
                  </>
                )}

                <Text size="s" weight="bold">
                  Valid Search Examples:
                </Text>

                <ul className={s.examplesList}>
                  <li>
                    <Text size="s">bwe-demos.near</Text>
                  </li>
                  <li>
                    <Text size="s">bwe-demos.near/HelloWorld</Text>
                  </li>
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
