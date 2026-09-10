import { EventoCalendarioConteudo } from '../tipos';

export function GERAR_LEMBRETE_ICS(evento: EventoCalendarioConteudo): string {
  const escapar = (s: string) => s.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const data = new Date(evento.dataHorario);
  if (!Number.isFinite(data.getTime())) throw new Error('Data inválida');
  const utc = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//GrowBiz//Agenda//PT-BR', 'BEGIN:VEVENT',
    `UID:${escapar(evento.id)}@growbiz`, `DTSTAMP:${utc(new Date())}`, `DTSTART:${utc(data)}`,
    `DTEND:${utc(new Date(data.getTime() + 15 * 60000))}`, `SUMMARY:${escapar(evento.titulo)}`,
    `DESCRIPTION:${escapar(`Publicar manualmente em ${evento.canal}.\n${evento.copy}`)}`,
    'BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', 'DESCRIPTION:Lembrete de postagem',
    'END:VALARM', 'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n');
}
