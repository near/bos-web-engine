/* eslint-disable @next/next/no-img-element */

import { Button, Dropdown } from '@bos-web-engine/ui';
import { X, CaretDown } from '@phosphor-icons/react';

import s from './WalletSelectorControl.module.css';
import { useSocialProfile } from '../hooks/useSocialProfile';
import { useWallet } from '../hooks/useWallet';

export function WalletSelectorControl() {
  const { account, wallet, walletSelector, walletSelectorModal } = useWallet();
  const { profile, profileImageUrl } = useSocialProfile(
    account?.accountId,
    walletSelector?.options.network
  );

  if (account && profile) {
    return (
      <Dropdown.Root>
        <Dropdown.Trigger asChild>
          <button type="button" className={s.accountDropdownButton}>
            {profileImageUrl && (
              <div className={s.avatar}>
                <img
                  className={s.avatarImage}
                  src={profileImageUrl}
                  alt="Avatar"
                />
              </div>
            )}

            <span className={s.accountName}>
              <span className={s.ellipsisOverflow}>
                {profile.name ?? account.accountId}
              </span>
              {profile.name && (
                <span className={s.ellipsisOverflow}>{account.accountId}</span>
              )}
            </span>

            <CaretDown
              weight="bold"
              className={s.icon}
              style={{ opacity: 0.5 }}
            />
          </button>
        </Dropdown.Trigger>

        <Dropdown.Content sideOffset={8}>
          <Dropdown.Item onSelect={() => wallet?.signOut()}>
            <X weight="bold" fill="var(--color-danger)" />
            Sign Out
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Root>
    );
  }

  return <Button onClick={() => walletSelectorModal?.show()}>Sign In</Button>;
}
