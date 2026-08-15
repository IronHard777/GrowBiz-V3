# Arquitetura base — GrowBiz V2.2

## Organização

O projeto segue uma estrutura por camadas, preservando a independência entre a interface e as regras de negócio.

- `app/`: roteamento e composição de navegação exigidos pelo Expo Router.

- `app/api/`: API Routes do Expo Router (`+api.ts`) — único lugar autorizado a ler segredos via `process.env`. Cada arquivo é um handler fino que delega a lógica para `src/infraestrutura`.

- `src/apresentacao/`: telas e componentes de interface.

- `src/aplicacao/`: casos de uso e orquestração de fluxos.

- `src/dominio/`: entidades, tipos e regras de negócio puras.

- `src/infraestrutura/`: implementações concretas, armazenamento, integrações externas (IA, concorrência, tendências) e mocks locais.

- `src/compartilhado/`: tema e recursos reutilizáveis entre funcionalidades.

## Decisões essenciais

1. O Expo Router usa `app/` somente para rotas. A interface da rota inicial permanece em `src/apresentacao/`, evitando acoplamento da camada visual à navegação.

2. O alias `@/` aponta para `src/`, reduzindo importações relativas extensas e reforçando os limites entre camadas.

3. O tema é composto por tokens de cor, espaçamento e tipografia centralizados. Componentes não devem repetir valores visuais literais quando houver token apropriado.

4. A sessão de autenticação é mantida somente em memória por `Context API`. Ela é intencionalmente descartada quando o aplicativo é reiniciado.

## Backend e integrações reais (a partir da fase de evolução V2.2)

5. `web.output` está configurado como `"server"` em `app.json` para habilitar API Routes do Expo Router — necessário para qualquer chamada que exija uma chave de API secreta (LLM, Google Places, Google Trends, etc.).

6. Segredos vivem em `.env` (git-ignorado; ver `.env.example` para as chaves esperadas por fase) e só são lidos dentro de `app/api/**/+api.ts`. Nenhum componente client-side (`src/apresentacao`, telas, contextos) deve importar `process.env` diretamente.

7. Serviços antes 100% simulados (`src/infraestrutura/**/servico*Simulada.ts`) estão sendo substituídos, fase a fase, por implementações que chamam as API Routes para obter classificação por IA, concorrência real, tendências de mercado e geração de conteúdo — mantendo os mesmos tipos de domínio (`ResultadoDoDiagnostico`, `EstrategiaGerada`, `ConteudoDaCampanha`) para não quebrar as telas existentes.

8. Dados que precisam sobreviver além de uma sessão (negócio cadastrado, diagnóstico, estratégias, calendário de conteúdo, métricas) exigem persistência real. O calendário de conteúdo (Módulo 3) continua com um cache local via `AsyncStorage` (`src/infraestrutura/calendario/repositorioDeEventos.ts`) para funcionar offline/sem banco configurado, mas negócio, diagnóstico, estratégia escolhida e calendário agora têm também uma camada de persistência em Postgres (ver decisão 11) — a integração é acionada automaticamente quando `DATABASE_URL` está configurada.

9. **Limitação conhecida (dev):** o servidor de desenvolvimento do Expo (`expo start --web`) impõe um timeout fixo de ~30s por requisição de API Route. Chamadas ao Grok com busca ao vivo (`src/infraestrutura/ia/grok.ts`) variam entre ~17s e ~30s+, então uma fração das chamadas estoura esse limite e retorna 502. Por isso `servicoDeConcorrenciaPorIa.ts` e `servicoDeTendenciaPorIa.ts` fazem até 3 tentativas e degradam graciosamente na UI ("não foi possível buscar agora") em vez de falhar. Esse timeout é da ferramenta de dev, não da aplicação — deve ser revalidado ao publicar num ambiente real (EAS Hosting ou outro servidor), que provavelmente não tem esse limite de 30s.

10. **Módulo 3 (criação) — estado atual (parcial):** upload de PDF de referência (`expo-document-picker` + `expo-file-system`, convertido a base64 e mantido apenas em memória durante o fluxo, sem persistência) e geração real de copy/imagem via Grok já funcionam. O calendário de conteúdo (`app/calendario.tsx` → `Calendario.tsx`) permite criar, editar, mover e excluir eventos, com sugestão de conteúdo via IA (`gerarConteudoDaCampanha`). Não existe ainda nenhum tipo de domínio, serviço ou tela para métricas — é uma lacuna em aberto.

11. **Persistência em Postgres (negócio, diagnóstico, estratégia escolhida, calendário):** implementada em `src/infraestrutura/persistencia/` (`conexao.ts` — pool `pg` lazy, lê `DATABASE_URL` só dentro de API Routes; `schema.sql` — DDL a ser executado manualmente no banco antes do primeiro uso). Como não existe autenticação real (decisão 4), a chave de propriedade dos dados é o `email` informado no login simulado — cada negócio é único por `email` (`negocios.email unique`); diagnóstico e estratégia escolhida são 1:1 com o negócio (upsert); eventos de calendário são N:1. As API Routes (`app/api/negocio+api.ts`, `app/api/diagnostico/persistencia+api.ts`, `app/api/estrategia/escolhida+api.ts`, `app/api/calendario/eventos+api.ts`) fazem apenas GET (buscar) e POST/PUT (salvar; calendário sincroniza a lista inteira por PUT, mesmo padrão de "salvar tudo" já usado pelo `AsyncStorage`). Do lado do cliente, `src/apresentacao/contextos/SincronizadorDeNegocio.tsx` (montado no `_layout.tsx`, dentro de todos os providers) observa os Contexts existentes e: (a) ao logar, tenta hidratar negócio/diagnóstico/estratégia/calendário do Postgres se o estado local ainda estiver vazio; (b) a cada mudança relevante, persiste em segundo plano. Todas as chamadas engolem erro silenciosamente (`.catch(() => {})` ou `try/catch` vazio) — sem `DATABASE_URL` configurada, ou com o banco fora do ar, o app se comporta exatamente como antes (mesmo princípio de degradação graciosa da decisão 9). O cache local via `AsyncStorage` do calendário (decisão 8) foi mantido como estava, não removido — a camada Postgres é aditiva.

12. **Métricas por evento de conteúdo:** novo tipo `MetricasDoEvento` (`src/dominio/calendario/tipos/`) com alcance/curtidas/comentários/cliques. Segue o mesmo padrão PorApi→Simulada dos outros módulos: `servicoDeMetricasPorApi.ts` chama `app/api/calendario/metricas+api.ts`, que hoje sempre retorna 503 porque `META_ACCESS_TOKEN` (reservado em `.env.example`) não existe — não há integração real com Instagram/Meta implementada, é só o ponto de extensão para quando essa chave existir. O fallback (`servicoDeMetricasSimulada.ts`) gera números pseudoaleatórios determinísticos a partir do `id` do evento (mesmo evento sempre mostra os mesmos números), então não precisa de tabela própria no Postgres — métricas de rede social são dado "ao vivo" por natureza, não algo que o usuário decide e precisa persistir como negócio/diagnóstico. Na tela `Calendario.tsx`, só eventos com `data <= hoje` mostram o botão de métricas (não faz sentido mostrar engajamento de um post que ainda não foi publicado).

13. **Persistência do arquivo de referência do upload (Módulo 3):** tabela `arquivos_de_referencia` (1:1 com o negócio, upsert) guarda o último PDF enviado (`nome_do_arquivo` + `conteudo_base64`, como texto — sem storage de objetos separado, aceitável dado o tamanho típico de cardápios/catálogos). Ao entrar em `CriacaoUpload.tsx`, se houver um arquivo salvo, aparece um botão "Usar arquivo salvo: `<nome>`" — mas **nunca é aplicado automaticamente**: o usuário decide se quer reenviá-lo ou selecionar um novo PDF, porque o material de referência pode ter sido revisado (ex.: cardápio com preços atualizados). Um novo upload sempre sobrescreve o arquivo salvo (fire-and-forget, mesmo padrão de degradação graciosa das outras decisões desta seção).

## Módulo 4 — Dashboard de performance

14. **Escopo e decisão de dados (deliberada, sem fallback simulado):** ao contrário das métricas por evento (decisão 12), o dashboard (`app/dashboard.tsx` → `Dashboard.tsx`) foi decidido para refletir **só dado real, nunca simulado** — se uma fonte não está conectada, a tela mostra "não conectada" com o motivo, em vez de inventar número. Isso significa que o dashboard fica majoritariamente vazio até as integrações abaixo serem configuradas com credenciais reais.

    - **Fontes modeladas:** `src/dominio/dashboard/tipos/FonteDeDados.ts` define três (`metaOrganico`, `metaAds`, `ifood`), cada uma com `disponivel` e `motivo` quando ausente.

    - **Meta orgânico e Meta Ads:** implementados de verdade em `src/infraestrutura/ia/metaGraph.ts` (chamadas à Graph API v21, escritas a partir da documentação pública, **nunca testadas contra uma conta real** — mesmo aviso de confiança dado à camada Postgres). Orgânico depende de `META_ACCESS_TOKEN` (reaproveitada da decisão 12) **e** de cada evento do calendário ter um `idDaPublicacao` vinculado manualmente (novo campo opcional em `EventoDeConteudo`, preenchido pelo usuário em `Calendario.tsx` depois de publicar de verdade — sem isso não há como saber qual post do Instagram corresponde a qual evento). Ads depende de `META_ADS_ACCESS_TOKEN` + `META_AD_ACCOUNT_ID`.

    - **iFood:** apenas o ponto de extensão (`statusDasFontes` sempre `disponivel: false`, motivo "ainda não implementada") — não existe uma API pública de conversão do iFood documentada com confiança suficiente para implementar agora; fica como próxima etapa quando houver clareza sobre qual API usar.

    - **Agregação:** `src/infraestrutura/persistencia/dashboardSql.ts` centraliza o cálculo (`calcularKpisDoNegocio`), usado tanto pela rota `GET app/api/dashboard/kpis+api.ts` (sob demanda, ao abrir a tela) quanto pela rotina semanal abaixo.

15. **Relatório semanal automático e alerta de pivotagem — sem agendador embutido:** o Expo Router não roda jobs em segundo plano; não existe "cron dentro do app". A geração do relatório é uma rota HTTP comum, `POST app/api/dashboard/executarRelatorioSemanal+api.ts`, protegida por um segredo (`CRON_SECRET`, comparado ao header `x-cron-secret`) — **rodar semanalmente exige configurar um agendador externo** (Vercel Cron, tarefa agendada do EAS Hosting, GitHub Actions com `schedule`, etc.) apontando para essa rota. Sem isso configurado, o relatório nunca é gerado sozinho. A rota percorre todos os negócios cadastrados (`listarNegocios`), pula os que ainda não têm diagnóstico, e para cada um: busca os KPIs consolidados (decisão 14), monta um prompt para o Claude (Anthropic, já real) pedindo texto interpretativo, comparação de ROI/esforço entre as três estratégias, alerta de decaimento de tendência e alerta de pivotagem — com instrução explícita de **nunca inventar números** quando os dados estiverem indisponíveis — e persiste o resultado em `relatorios_semanais` (histórico completo; a tela sempre busca o mais recente por `periodo_fim`). A tela `Dashboard.tsx` só lê o último relatório salvo (`GET app/api/dashboard/relatorios+api.ts`) e nunca dispara a geração ela mesma.

## Próximas etapas planejadas

- Provisionar um Postgres gerenciado (ex.: Neon, Supabase), executar `src/infraestrutura/persistencia/schema.sql` nele e preencher `DATABASE_URL` no `.env` para validar toda a persistência (negócio/diagnóstico/estratégia/calendário/arquivo de referência/relatórios) de ponta a ponta — ainda não testada contra um banco real.

- Métricas por evento (decisão 12) são só simuladas por enquanto; o dashboard (decisões 14-15) usa dados reais mas provavelmente ficará vazio até: (a) preencher `META_ACCESS_TOKEN`/`META_ADS_ACCESS_TOKEN`/`META_AD_ACCOUNT_ID`, (b) vincular manualmente o `idDaPublicacao` de cada post publicado no calendário, e (c) configurar o cron externo com `CRON_SECRET` para a rotina semanal rodar.

- Definir e implementar a integração real com iFood (decisão 14) quando houver clareza sobre qual API/contrato usar.

- Reavaliar o limite de timeout de 30s do servidor de dev (decisão #9) ao migrar para hospedagem real (EAS Hosting ou similar) — relevante também para a rotina semanal do Módulo 4, que chama a IA várias vezes em sequência (uma por negócio).

- Se o app ganhar autenticação real no futuro, revisar o uso de `email` como chave de propriedade dos dados persistidos (decisão 11) — hoje é um valor não verificado, aceitável apenas porque o login também é simulado (decisão 4).

Prompt em linguagem simples:

O que é o GrowBiz

O GrowBiz é um assistente de marketing digital com inteligência artificial para pequenos e médios negócios. Em poucos passos, ele entende o negócio do usuário, recomenda uma estratégia de divulgação sob medida, cria o conteúdo pronto para publicar e acompanha se está dando resultado — tudo isso sem exigir que o dono do negócio entenda de marketing.

🔹 1. Diagnóstico do negócio (o ponto de partida)

O usuário conta sobre o negócio: nome, setor, o que vende, se atende presencial/online/híbrido, e onde atua.

Responde a 7 perguntas rápidas sobre objetivo, maior desafio, orçamento, frequência de publicação, público e canais preferidos.

A IA analisa tudo e devolve um diagnóstico claro, sempre explicando o porquê — e já pesquisa na internet quem são os concorrentes próximos e a tendência do momento no setor.

🔹 2. Estratégia sob medida (o plano de ação)

A IA monta três caminhos: uma estratégia de base (presença constante), uma de oportunidade (aproveitar uma tendência rápido) e uma complementar (ações fora das redes sociais). O usuário escolhe a que faz mais sentido agora.

🔹 3. Criação de conteúdo pronto para publicar

O usuário pode enviar um material de referência (cardápio, catálogo) que fica salvo para reaproveitar depois.

A IA gera legenda, imagem, roteiro de vídeo curto e hashtags — tudo já adaptado a cada canal (Instagram, WhatsApp, etc.).

🔹 4. Calendário de conteúdo (a organização)

O conteúdo pode ser agendado num calendário visual, criado, editado ou movido com poucos toques. Depois de publicar de verdade, dá para acompanhar alcance, curtidas, comentários e cliques de cada post.

🔹 5. Painel de desempenho (a prova de resultado)

Mostra engajamento geral, alcance orgânico versus pago e conversão por canal. Toda semana, a IA gera automaticamente um relatório que interpreta os números, compara as três estratégias e aponta qual traz mais retorno — e avisa quando uma tendência está perdendo força ou quando é hora de mudar de estratégia.

Em uma frase: O GrowBiz pega um pequeno negócio sem tempo nem equipe de marketing e entrega, com ajuda de inteligência artificial, um diagnóstico claro, uma estratégia sob medida, conteúdo pronto para publicar, um calendário organizado e um painel que mostra — em linguagem simples — se está funcionando.