import { useEffect } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import { useFlags } from '@/hooks/useFlags';
import s from '@/styles/flags.module.css';

type FormData = {
  bosLoaderUrl: string;
};

export default function FlagsPage() {
  const [flags, setFlags] = useFlags();
  const form = useForm<FormData>();

  useEffect(() => {
    form.setValue('bosLoaderUrl', flags?.bosLoaderUrl || '');
  }, [form, flags]);

  const submitHandler: SubmitHandler<FormData> = (data: any) => {
    setFlags(data);
  };

  return (
    <div className={`${s.container} container-xl`}>
      <h1>Flags</h1>
      <p>
        Use the <code>-w</code> flag on bos-loader to run in BOS Web Engine mode
      </p>

      <form className={s.form} onSubmit={form.handleSubmit(submitHandler)}>
        <div className={s.inputGrid}>
          <label htmlFor="bosLoaderUrl">BOS Loader Url</label>

          <input
            className="form-control"
            placeholder="e.g. http://127.0.0.1:3030/, https://my-loader.ngrok.io"
            id="bosLoaderUrl"
            {...form.register('bosLoaderUrl')}
          />
        </div>

        <button type="submit" style={{ marginLeft: 'auto' }}>
          Save Flags
        </button>
      </form>
    </div>
  );
}
