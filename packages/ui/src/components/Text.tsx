import type { CSSProperties, ReactNode } from 'react';

import s from './Text.module.css';

type Color = 'text-1' | 'text-2' | 'danger' | 'affirm';
type Size = 'xs' | 's' | 'base' | 'l' | 'xl' | '2xl' | '3xl' | 'hero';
type Tag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
type Weight = 'bold' | 'regular';

type Props = {
  as?: Tag;
  children: ReactNode;
  color?: Color;
  id?: string;
  size?: Size;
  style?: CSSProperties;
  uppercase?: boolean;
  weight?: Weight;
};

const defaultSizes: Record<Tag, Size> = {
  h1: '2xl',
  h2: 'xl',
  h3: 'l',
  h4: 'base',
  h5: 's',
  h6: 'xs',
  p: 'base',
  span: 'base',
};

const defaultColors: Record<Size, Color> = {
  xs: 'text-2',
  s: 'text-2',
  base: 'text-1',
  l: 'text-1',
  xl: 'text-1',
  '2xl': 'text-1',
  '3xl': 'text-1',
  hero: 'text-1',
};

export const Text = ({
  as = 'p',
  children,
  color,
  size,
  uppercase,
  weight,
  ...props
}: Props) => {
  const Tag = as;
  const defaultSize = defaultSizes[as];
  const defaultColor = defaultColors[size || defaultSize];

  return (
    <Tag
      className={s.text}
      data-color={color || defaultColor}
      data-size={size || defaultSize}
      data-uppercase={uppercase}
      data-weight={weight}
      {...props}
    >
      {children}
    </Tag>
  );
};
