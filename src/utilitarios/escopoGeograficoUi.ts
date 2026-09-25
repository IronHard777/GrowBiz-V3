import { EscopoGeografico } from '../tipos';

/** Campo de detalhe do escopo: Cidade / Estado-Região / País / oculto. */
export type CampoLocalidadeEscopo = {
  mostrar: boolean;
  label: string;
  placeholder: string;
  obrigatorio: boolean;
  ajuda: string;
};

export function OBTER_CAMPO_LOCALIDADE_ESCOPO(escopo: EscopoGeografico): CampoLocalidadeEscopo {
  switch (escopo) {
    case 'Local':
    case 'Metropolitana':
      return {
        mostrar: true,
        label: 'Cidade',
        placeholder: 'Ex: São Paulo, Campinas, BH...',
        obrigatorio: escopo === 'Metropolitana',
        ajuda:
          escopo === 'Metropolitana'
            ? 'Obrigatório para área metropolitana — melhora a assertividade da IA.'
            : 'Informe a cidade para refinar o sensoriamento local.'
      };
    case 'Regional':
      return {
        mostrar: true,
        label: 'Estado / Região',
        placeholder: 'Ex: SP, Sul de Minas, Grande ABC...',
        obrigatorio: true,
        ajuda: 'Informe o estado ou a região de atuação.'
      };
    case 'Nacional':
      return {
        mostrar: true,
        label: 'País',
        placeholder: 'Ex: Brasil...',
        obrigatorio: true,
        ajuda: 'Informe o país de atuação.'
      };
    case 'Global':
    default:
      return {
        mostrar: false,
        label: '',
        placeholder: '',
        obrigatorio: false,
        ajuda: ''
      };
  }
}

export const OPCOES_ESCOPO_GEOGRAFICO: { value: EscopoGeografico; label: string }[] = [
  { value: 'Local', label: 'Local' },
  { value: 'Metropolitana', label: 'Área metropolitana' },
  { value: 'Regional', label: 'Regional (Estado)' },
  { value: 'Nacional', label: 'Nacional' },
  { value: 'Global', label: 'Global / Internacional' }
];
