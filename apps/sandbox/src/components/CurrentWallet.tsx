/* eslint-disable @next/next/no-img-element */

import { useWallet } from '@/hooks/useWallet';
import s from './CurrentWallet.module.css';
import * as Dropdown from './Dropdown';
import { X, CaretDown } from '@phosphor-icons/react';
import { useProfile } from '@/hooks/useProfile';

export function CurrentWallet() {
  const { account, wallet, walletSelectorModal } = useWallet();
  const { profile, profileImageUrl } = useProfile();

  if (account && profile) {
    return (
      <div className={s.wrapper}>
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
                  <span className={s.ellipsisOverflow}>
                    {account.accountId}
                  </span>
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
      </div>
    );
  }

  return (
    <div className={s.wrapper}>
      <button
        type="button"
        className={s.button}
        onClick={() => walletSelectorModal?.show()}
      >
        Sign In
      </button>
    </div>
  );
}
