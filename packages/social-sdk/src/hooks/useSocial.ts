import { useContext } from 'react';

import { SocialContext } from '../components/SocialProvider';

export const useSocial = () => {
  const { social } = useContext(SocialContext) ?? {};

  return {
    social,
  };
};
