import { useEffect } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import styled from "styled-components";

import { useFlags } from "../hooks/useFlags";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem 1rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InputGrid = styled.div`
  display: grid;
  grid-template-columns: max-content 1fr;
  align-items: center;
  gap: 1rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

type FormData = {
  bosLoaderUrl: string;
};

export default function FlagsPage() {
  const [flags, setFlags] = useFlags();
  const form = useForm<FormData>();

  useEffect(() => {
    form.setValue("bosLoaderUrl", flags?.bosLoaderUrl || "");
  }, [form, flags]);

  const submitHandler: SubmitHandler<FormData> = (data) => {
    setFlags(data);
  };

  return (
    <Container className="container-xl">
      <h1>Flags</h1>

      <Form onSubmit={form.handleSubmit(submitHandler)}>
        <InputGrid>
          <label htmlFor="bosLoaderUrl">BOS Loader Url</label>

          <input
            className="form-control"
            placeholder="e.g. http://127.0.0.1:3030/, https://my-loader.ngrok.io"
            id="bosLoaderUrl"
            {...form.register("bosLoaderUrl")}
          />
        </InputGrid>

        <button type="submit" style={{ marginLeft: "auto" }}>
          Save Flags
        </button>
      </Form>
    </Container>
  );
}
