import {
  SOCIAL_COMPONENT_NAMESPACE,
  useSocial,
} from '@bos-web-engine/social-db-api';
import { Button, HR, Text } from '@bos-web-engine/ui';
import { useWallet } from '@bos-web-engine/wallet-selector-control';
import { useState } from 'react';

import s from './PublishButton.module.css';
import { useSandboxStore } from '../hooks/useSandboxStore';
import { convertFilePathToComponentName } from '../utils';

type Props = {
  selectedFilePaths: string[];
};

export function PublishButton({ selectedFilePaths }: Props) {
  const files = useSandboxStore((store) => store.files);
  const publishedFiles = useSandboxStore((store) => store.publishedFiles);
  const setPublishedFiles = useSandboxStore((store) => store.setPublishedFiles);
  const { account, walletSelectorModal } = useWallet();
  const { social } = useSocial();
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState('');

  const publish = async () => {
    try {
      setError('');
      setIsPublishing(true);

      const components: {
        [componentName: string]: {
          '': string;
          css?: string;
          metadata?: Record<string, any>;
        };
      } = {};

      selectedFilePaths.forEach((filePath) => {
        const file = files[filePath];
        if (file) {
          const componentName = convertFilePathToComponentName(filePath);
          components[componentName] = {
            '': file.source,
            css: file.css ?? '',
            // TODO: Pass along metadata once exposed in UI
          };
        }
      });

      await social.set({
        data: {
          [SOCIAL_COMPONENT_NAMESPACE]: components,
        },
      });

      // Update our published files immediately to match what's been successfully published:

      const updatedPublishedFiles = {
        ...publishedFiles,
      };
      selectedFilePaths.forEach((filePath) => {
        const file = files[filePath];
        updatedPublishedFiles[filePath] = file;
      });
      setPublishedFiles(updatedPublishedFiles);
    } catch (error) {
      console.error(error);
      setError('Failed to publish your changes. Please try again later.');
    } finally {
      setIsPublishing(false);
    }
  };

  if (!account) {
    return (
      <div className={s.wrapper}>
        <Text size="s">To publish your components, please sign in.</Text>
        <HR />
        <Button onClick={() => walletSelectorModal?.show()}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className={s.wrapper}>
      {error && (
        <>
          <Text size="s" color="danger">
            {error}
          </Text>
          <HR />
        </>
      )}

      <Button
        disabled={selectedFilePaths.length < 1}
        loading={isPublishing}
        onClick={publish}
      >
        Publish Selected
      </Button>
    </div>
  );
}
