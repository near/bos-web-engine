import type { ComponentEntry } from '@bos-web-engine/compiler';
import { SocialDb } from '@bos-web-engine/social-db';
import cors from 'cors';
import express from 'express';

const app = express();
app.use(cors());

const sourceCache = new Map<string, string>();
const social = new SocialDb({ networkId: 'mainnet' });

app.get('/*', async function (req, res) {
  const key = req.path.slice(1).split('.').slice(0, -1).join('.');
  let cached: string | undefined | ComponentEntry = sourceCache.get(key);

  try {
    if (!cached) {
      const {
        'andyh.near': { component_alpha },
      } = await social.get<any>({
        key: `${key}/**`,
      });

      sourceCache.set(req.path, JSON.stringify(component_alpha));
      cached = component_alpha as ComponentEntry;
    } else {
      cached = JSON.parse(cached) as ComponentEntry;
    }
  } catch (e) {
    res.send(`unknown key ${key}`);
    return;
  }

  const [componentName] = key.split('/').slice(-1);
  if (req.path.endsWith('.css')) {
    res.set('Content-Type', 'text/css');
    res.send((cached[componentName] as ComponentEntry).css);
    return;
  }

  if (req.path.endsWith('.js')) {
    res.set('Content-Type', 'text/javascript');
    res.send((cached[componentName] as ComponentEntry)['']);
    return;
  }

  res.send(`unknown key ${key}`);
});

app.listen(3003);
