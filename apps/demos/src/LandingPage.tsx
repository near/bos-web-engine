import { useState } from 'react';
import s from './LandingPage.module.css';

function LandingPage() {
  const [showContainerBoundaries, setShowContainerBoundaries] =
    useState<boolean>(false);

  const buildUrl = (componentPath: string) => {
    return `/${componentPath}?showContainerBoundaries=${showContainerBoundaries}`;
  };

  return (
    <div className={s.wrapper}>
      <div className={s.card}>
        <header>
          <div className={s.logo}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 144">
              <path
                d="M115.58,7.31,85.48,52a3.2,3.2,0,0,0,4.75,4.2l29.63-25.68a1.2,1.2,0,0,1,2,.91v80.46a1.2,1.2,0,0,1-2.12.77L30.18,5.43A15.35,15.35,0,0,0,18.47,0H15.34A15.34,15.34,0,0,0,0,15.34V128.66A15.34,15.34,0,0,0,15.34,144h0a15.35,15.35,0,0,0,13.08-7.31L58.52,92a3.2,3.2,0,0,0-4.75-4.2L24.14,113.48a1.2,1.2,0,0,1-2-.91V32.11a1.2,1.2,0,0,1,2.12-.77l89.55,107.23A15.35,15.35,0,0,0,125.53,144h3.13A15.34,15.34,0,0,0,144,128.66V15.34A15.34,15.34,0,0,0,128.66,0h0A15.35,15.35,0,0,0,115.58,7.31Z"
                fill="currentColor"
              />
            </svg>
            <h1>BOS Web Engine</h1>
          </div>
        </header>

        <hr />

        <section className={s.section}>
          <h2>Get Started</h2>

          <p>
            Click the links below to try out demo components:
          </p>

          <label className={s.label}>
            <input
              className={s.checkbox}
              type="checkbox"
              value=""
              checked={showContainerBoundaries}
              onChange={() => setShowContainerBoundaries((value) => !value)}
            />
            Show Container Boundaries
          </label>

          <ul className={s.list}>
            <li>
              <a className={s.link} href={buildUrl('bwe-demos.near/AlphaDashboardPage')}>Alpha Dashboard</a>
            </li>
            <li>
              <a className={s.link} href={buildUrl('bwe-demos.near/SocialFeedPage')}>Social Feed</a>
            </li>
            <li>
              <a className={s.link} href={buildUrl('bwe-demos.near/StateAndTrust.Root')}>
                Sandboxed and Trusted State
              </a>
            </li>
            <li>
              <a className={s.link} href={buildUrl('bwe-demos.near/NPM.Tracker')}>
                NPM Compatability Tracker
              </a>
            </li>
            <li>
              <a className={s.link} href={buildUrl('bwe-demos.near/WalletSelector.CurrentAccount')}>
                Wallet Selector: <code>getAccounts</code>
              </a>
            </li>
            <li>
              <a className={s.link} href={buildUrl('bwe-demos.near/WalletSelector.SignAndSendTransaction')}>
                Wallet Selector: <code>signAndSendTransaction</code>
              </a>
            </li>
            <li>
              <a className={s.link} href={buildUrl('bwe-demos.near/WalletSelector.SignMessage')}>
                Wallet Selector: <code>signMessage</code>
              </a>
            </li>
            <li>
              <a className={s.link} href={buildUrl('bwe-demos.near/SocialGet')}>
                SocialDB: get
              </a>
            </li>
            <li>
              <a className={s.link} href={buildUrl('bwe-demos.near/SocialSet')}>
                SocialDB: set
              </a>
            </li>
            <li>
              <a className={s.link} href={buildUrl('bwe-demos.near/ComponentSource')}>
                Component Source Inspector
              </a>
            </li>
            <li>
              <a className={s.link} href={buildUrl('bwe-demos.near/ContainerStorage')}>
                Container Storage
              </a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default LandingPage as BWEComponent;
