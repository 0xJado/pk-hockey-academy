import { readFile, mkdir } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { Client } from 'ssh2';

export const privateRoot = new URL('../../../output/strato-private/', import.meta.url);
export const settings = async () => {
  let local={};
  try{local=parseEnv(await readFile(new URL('../.env.local',import.meta.url),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
  return {...local,...Object.fromEntries(Object.entries(process.env).filter(([key])=>key.startsWith('STRATO_')))};
};

export async function connect() {
  const env = await settings();
  const pin = env.STRATO_SFTP_HOST_KEY ? {host:env.STRATO_SFTP_HOST,key:env.STRATO_SFTP_HOST_KEY}
    : JSON.parse(await readFile(new URL('host-key.json', privateRoot), 'utf8'));
  if (!env.STRATO_SFTP_PASSWORD || pin.host !== env.STRATO_SFTP_HOST)
    throw new Error('Local deployment credentials or pinned host do not match');
  const conn = new Client();
  await new Promise((resolve, reject) => {
    conn.once('ready', resolve); conn.once('error', reject);
    conn.connect({ host: env.STRATO_SFTP_HOST, port: Number(env.STRATO_SFTP_PORT || 22),
      username: env.STRATO_SFTP_USERNAME, password: env.STRATO_SFTP_PASSWORD,
      readyTimeout: 20000, hostVerifier: key => key.toString('base64') === pin.key });
  });
  try {
    const sftp = await new Promise((resolve, reject) => conn.sftp((error, channel) => error ? reject(error) : resolve(channel)));
    const call = (method, ...args) => new Promise((resolve, reject) =>
      sftp[method](...args, (error, result) => error ? reject(error) : resolve(result)));
    if (await call('realpath', '.') !== '/' || await call('realpath', '..') !== '/')
      throw new Error('Unexpected SFTP root');
    await mkdir(privateRoot, {recursive: true});
    return { call, close: () => conn.end() };
  } catch (error) { conn.end(); throw error; }
}
