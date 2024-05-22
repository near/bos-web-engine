import * as Social from '@bos-web-engine/social-db';
import express from 'express';

const { SocialDb } = Social;
const app = express();

const sourceCache = new Map();

app.get('/*', async function (req, res) {
  await new Promise((res) => res());
  console.log(SocialDb);
  res.send(`Hello ${req.path.slice(1)}`);
});

app.listen(3000);
