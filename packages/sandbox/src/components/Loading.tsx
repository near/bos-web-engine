import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;

  p {
    font-size: 1rem;
    line-height: 1.5;
    color: currentColor;
  }
`;

const Spinner = styled.div`
  display: inline-flex;
  width: 3rem;
  height: 3rem;
  animation: spin 1.2s linear infinite;
  border-radius: 50%;
  border: 4px solid currentColor;
  border-color: currentColor transparent currentColor transparent;
  flex-shrink: 0;
  flex-grow: 0;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

type Props = {
  message?: string;
};

export function Loading({ message }: Props) {
  return (
    <Wrapper>
      <Spinner />

      <p>{message ?? 'Loading...'}</p>
    </Wrapper>
  );
}
