import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
  console.error(JSON.stringify({ ok: false, erro: 'Chave Gemini ausente' }));
  process.exit(1);
}

const modelos = [
  'veo-3.1-fast-generate-preview',
  'veo-3.1-generate-preview'
];

const prompt = 'Vertical 9:16 photorealistic close-up of a Brazilian espresso being poured into a ceramic cup, creamy crema, warm cafe lighting, no text, no logos, cinematic slow motion, 4 seconds.';

function resumirErro(erro) {
  const msg = erro?.message || String(erro);
  const status = erro?.status || erro?.code || erro?.error?.code;
  return { mensagem: msg.slice(0, 500), status: status ?? null };
}

async function baixar(video, ai) {
  if (video?.videoBytes) {
    const buf = Buffer.from(video.videoBytes, 'base64');
    return { origem: 'videoBytes', bytes: buf.length, buffer: buf };
  }
  const uri = video?.uri;
  if (!uri) return null;

  try {
    if (typeof ai.files?.download === 'function') {
      const saida = join(tmpdir(), `growbiz-veo-${Date.now()}.mp4`);
      await ai.files.download({ file: video, downloadPath: saida });
      const { readFileSync, statSync } = await import('node:fs');
      const st = statSync(saida);
      return { origem: 'files.download', bytes: st.size, buffer: readFileSync(saida), caminho: saida };
    }
  } catch (e) {
    console.warn('files.download falhou:', resumirErro(e));
  }

  const url = uri.includes('key=') ? uri : `${uri}${uri.includes('?') ? '&' : '?'}key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return { origem: 'fetch-uri', bytes: buf.length, buffer: buf };
}

const ai = new GoogleGenAI({ apiKey });
const relatorio = { chavePresente: true, chaveTamanho: apiKey.length, tentativas: [] };

for (const modelo of modelos) {
  const tentativa = { modelo, ok: false };
  try {
    console.error(`>> iniciando ${modelo}`);
    let operation = await ai.models.generateVideos({
      model: modelo,
      source: { prompt },
      config: {
        numberOfVideos: 1,
        aspectRatio: '9:16',
        durationSeconds: 4
      }
    });

    tentativa.operationName = operation?.name || operation?.operation?.name || null;
    let polls = 0;
    while (!operation?.done && polls < 24) {
      polls += 1;
      console.error(`>> poll ${polls} done=${Boolean(operation?.done)}`);
      await new Promise(r => setTimeout(r, 8000));
      operation = await ai.operations.get({ operation });
    }

    tentativa.polls = polls;
    tentativa.done = Boolean(operation?.done);
    tentativa.error = operation?.error || null;

    const gerados = operation?.response?.generatedVideos;
    tentativa.quantidade = Array.isArray(gerados) ? gerados.length : 0;
    tentativa.chavesResponse = operation?.response ? Object.keys(operation.response) : [];

    const video = gerados?.[0]?.video || gerados?.[0];
    tentativa.videoKeys = video ? Object.keys(video) : [];
    tentativa.temUri = Boolean(video?.uri);
    tentativa.temBytes = Boolean(video?.videoBytes);

    if (!operation?.done) throw new Error('timeout');
    if (operation?.error) throw new Error(JSON.stringify(operation.error).slice(0, 300));
    if (!video) throw new Error('sem arquivo de video na resposta');

    const arquivo = await baixar(video, ai);
    if (!arquivo) throw new Error('nao foi possivel baixar o mp4');

    const saida = join(tmpdir(), `growbiz-veo-ok-${Date.now()}.mp4`);
    writeFileSync(saida, arquivo.buffer);
    tentativa.ok = true;
    tentativa.origem = arquivo.origem;
    tentativa.bytes = arquivo.bytes;
    tentativa.assinatura = arquivo.buffer.subarray(0, 12).toString('hex');
    tentativa.caminho = saida;
    relatorio.tentativas.push(tentativa);
    relatorio.ok = true;
    console.log(JSON.stringify(relatorio, null, 2));
    process.exit(0);
  } catch (erro) {
    tentativa.erro = resumirErro(erro);
    relatorio.tentativas.push(tentativa);
    console.error(`>> falha ${modelo}:`, tentativa.erro);
  }
}

relatorio.ok = false;
console.log(JSON.stringify(relatorio, null, 2));
process.exit(1);
