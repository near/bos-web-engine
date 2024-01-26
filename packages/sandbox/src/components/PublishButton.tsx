import { useSocial } from '@bos-web-engine/social-sdk';
import { Button, HR, Text } from '@bos-web-engine/ui';
import { useWallet } from '@bos-web-engine/wallet-selector-control';

import s from './PublishButton.module.css';

type Props = {
  selectedFilePaths: string[];
};

export function PublishButton({ selectedFilePaths }: Props) {
  const { account, walletSelectorModal } = useWallet();
  const { social } = useSocial();

  const publish = async () => {
    await social?.set({
      data: {
        profile: {
          name: 'Caleb Jacob',
        },
      },
    });
  };

  if (!account) {
    return (
      <div className={s.wrapper}>
        <HR />
        <Text size="xs">
          To publish your components, please sign in with your wallet.
        </Text>
        <Button onClick={() => walletSelectorModal?.show()}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className={s.wrapper}>
      <Button disabled={selectedFilePaths.length < 1} onClick={publish}>
        Publish Selected
      </Button>
    </div>
  );
}
