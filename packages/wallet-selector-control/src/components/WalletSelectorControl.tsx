/* eslint-disable @next/next/no-img-element */

import { Button, Dropdown } from '@bos-web-engine/ui';
import type { WalletSelector } from '@near-wallet-selector/core';
import type { WalletSelectorModal } from '@near-wallet-selector/modal-ui';
import { X, CaretDown } from '@phosphor-icons/react';

import s from './WalletSelectorControl.module.css';
import { useSocialProfile } from '../hooks/useSocialProfile';
import { useWalletState } from '../hooks/useWalletState';

type Props = {
  walletSelector: WalletSelector | null;
  walletSelectorModal: WalletSelectorModal | null;
};

export function WalletSelectorControl({
  walletSelector,
  walletSelectorModal,
}: Props) {
  const { account, wallet } = useWalletState(walletSelector);
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
