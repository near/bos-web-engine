import { useContext } from 'react';

import { SocialContext } from '../components/SocialProvider';

export const useSocial = () => {
  const context = useContext(SocialContext);

  if (!context) {
    throw new Error(
      'useSocial() must be used inside the context provided by <SocialProvider>'
    );
  }

  let { social } = context;

  return {
    social,
  };
};
