import { PerfilUsuario } from '../tipos';
import { SALVAR_PERFIL_USUARIO_PERSISTENCIA } from './servicoPersistencia';

/**
 * Serviço de Autenticação e Gestão de Sessão do GrowBiz V2.2
 */

const CHAVE_SESSAO_LOCAL = 'growbiz_sessao_usuario_v2';

export const OBTER_USUARIO_LOGADO = (): PerfilUsuario | null => {
  try {
    const dados = localStorage.getItem(CHAVE_SESSAO_LOCAL);
    return dados ? JSON.parse(dados) : null;
  } catch (e) {
    console.error("Erro ao carregar sessão local:", e);
    return null;
  }
};

export const SALVAR_SESSAO_USUARIO = (usuario: PerfilUsuario): void => {
  try {
    localStorage.setItem(CHAVE_SESSAO_LOCAL, JSON.stringify(usuario));
    SALVAR_PERFIL_USUARIO_PERSISTENCIA(usuario);
  } catch (e) {
    console.error("Erro ao salvar sessão local:", e);
  }
};

export const ENCERRAR_SESSAO = (): void => {
  localStorage.removeItem(CHAVE_SESSAO_LOCAL);
};

export const CRIAR_USUARIO_DEMO = (): PerfilUsuario => {
  const usuarioDemo: PerfilUsuario = {
    id: `usr_demo_${Date.now()}`,
    nomeEmpresaOuUsuario: 'Café & Varejo Express',
    email: 'empreendedor@growbiz.com.br',
    telefone: '(11) 98765-4321',
    setor: 'Cafeteria e Varejo',
    modeloOperacional: 'Presencial',
    escopoGeografico: 'Local',
    dataCriacao: new Date().toISOString()
  };
  SALVAR_SESSAO_USUARIO(usuarioDemo);
  return usuarioDemo;
};
