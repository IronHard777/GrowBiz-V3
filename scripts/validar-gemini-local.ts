import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { OBTER_SETE_PERGUNTAS_ESTRATEGICAS, CRIAR_DIAGNOSTICO_COMPLETO } from '../src/servicos/servicoDiagnostico';
import { GERAR_MOCK_CAMPANHA_MODULO_3 } from '../src/servicos/servicoIA';
import { GERAR_SENSORIAMENTO_MERCADO_GEMINI, GERAR_IMAGEM_IMAGEN3 } from '../src/servicos/servicoGemini';
import { MONTAR_PROMPT_VISUAL } from '../src/servicos/servicoContextoVisual';
const perguntas=OBTER_SETE_PERGUNTAS_ESTRATEGICAS('Salão de cabeleireiro');
const respostas=Object.fromEntries(perguntas.map(p=>[p.id,{valores:[p.opcoes[0].valor]}]));
const d=CRIAR_DIAGNOSTICO_COMPLETO('Hair Blue Salão','Salão de cabeleireiro','Presencial','Local',respostas);
await mkdir('build/validacao',{recursive:true});
const results=await Promise.allSettled([
  GERAR_SENSORIAMENTO_MERCADO_GEMINI(d.setor,d.nomeNegocio,d.escopoGeografico,d).then(async r=>{await writeFile('build/validacao/pesquisa.json',JSON.stringify(r,null,2));console.log('Pesquisa:',r?.statusPesquisa||'indisponivel','fontes:',r?.fontes?.length||0);}),
  GERAR_IMAGEM_IMAGEN3(MONTAR_PROMPT_VISUAL(d,GERAR_MOCK_CAMPANHA_MODULO_3(d))).then(async img=>{if(!img){console.log('Imagem indisponível');return;}await writeFile('build/validacao/salao.png',Buffer.from(img.split(',')[1],'base64'));console.log('Imagem salva para inspeção');})
]);
console.log(results.map(r=>r.status));
