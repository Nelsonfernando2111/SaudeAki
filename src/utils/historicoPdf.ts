import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import {
  dataExame,
  INFO_CLASSIFICACAO,
  INFO_CONDUTA,
  INFO_ESTADO_CONDICAO,
  INFO_SEVERIDADE,
  INFO_STATUS_EXAME,
  posologia,
  statusExame,
  tipoSanguineo,
} from '@/src/utils/clinico';
import { formatarData, formatarDataHora } from '@/src/utils/datas';
import type { CondicaoMedica, Exame, HistoricoClinico, Prescricao } from '@/src/types';
import { colors } from '@/src/theme';

/** Evita que texto do utilizador quebre o HTML */
function esc(v?: string | number | null): string {
  if (v == null || v === '') return '—';
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const etiqueta = (texto: string, cor: string, fundo: string) =>
  `<span class="tag" style="color:${cor};background:${fundo}">${esc(texto)}</span>`;

function tabelaCondicoes(lista: CondicaoMedica[], vazio: string) {
  if (lista.length === 0) return `<p class="vazio">${vazio}</p>`;
  const linhas = lista
    .map((c) => {
      const sev = INFO_SEVERIDADE[c.severidade];
      const estado = INFO_ESTADO_CONDICAO[c.estado ?? 'ATIVA'];
      const extra = [
        c.codigoCid ? `CID ${esc(c.codigoCid)}` : null,
        c.agente ? `Agente: ${esc(c.agente)}` : null,
        c.reacaoObservada ? `Reação: ${esc(c.reacaoObservada)}` : null,
        c.conduta ? `Conduta: ${esc(INFO_CONDUTA[c.conduta].label)}` : null,
        c.observacoes ? esc(c.observacoes) : null,
      ]
        .filter(Boolean)
        .join('<br/>');
      return `<tr>
        <td><strong>${esc(c.descricao)}</strong>${extra ? `<div class="sub">${extra}</div>` : ''}</td>
        <td>${etiqueta(sev.label, sev.cor, sev.fundo)}</td>
        <td>${etiqueta(estado.label, estado.cor, estado.fundo)}</td>
        <td>${c.dataInicio ? formatarData(c.dataInicio) : '—'}</td>
        <td>${formatarData(c.registradoEm)}<div class="sub">${esc(c.registadoPorNome)}</div></td>
      </tr>`;
    })
    .join('');
  return `<table>
    <thead><tr><th>Descrição</th><th>Severidade</th><th>Estado</th><th>Início</th><th>Registo</th></tr></thead>
    <tbody>${linhas}</tbody>
  </table>`;
}

function tabelaPrescricoes(lista: Prescricao[], vazio: string) {
  if (lista.length === 0) return `<p class="vazio">${vazio}</p>`;
  const linhas = lista
    .map(
      (p) => `<tr>
        <td><strong>${esc(p.nomeMedicamento)}</strong>${p.classeFarmacologica ? `<div class="sub">${esc(p.classeFarmacologica)}</div>` : ''}</td>
        <td>${esc(posologia(p))}</td>
        <td>${esc(p.medicoNome)}</td>
        <td>${formatarData(p.dataPrescricao)}</td>
      </tr>`
    )
    .join('');
  return `<table>
    <thead><tr><th>Medicamento</th><th>Posologia</th><th>Médico</th><th>Data</th></tr></thead>
    <tbody>${linhas}</tbody>
  </table>`;
}

function blocoExame(e: Exame) {
  const st = INFO_STATUS_EXAME[statusExame(e)];
  const resultados = e.resultado ?? [];
  const tabela =
    resultados.length === 0
      ? ''
      : `<table class="resultados">
          <thead><tr><th>Parâmetro</th><th>Valor</th><th>Referência</th><th>Classificação</th></tr></thead>
          <tbody>${resultados
            .map((r) => {
              const cls = r.classificacao ? INFO_CLASSIFICACAO[r.classificacao] : null;
              return `<tr>
                <td>${esc(r.nomeParametro)}</td>
                <td>${esc(r.valor)}${r.unidadeMedida ? ` ${esc(r.unidadeMedida)}` : ''}</td>
                <td>${esc(r.valorReferencia)}</td>
                <td>${cls ? etiqueta(cls.label, cls.cor, cls.fundo) : '—'}</td>
              </tr>`;
            })
            .join('')}</tbody>
        </table>`;
  const laudo = [
    e.indicacaoClinica ? `<p><b>Indicação clínica:</b> ${esc(e.indicacaoClinica)}</p>` : '',
    e.achados ? `<p><b>Achados:</b> ${esc(e.achados)}</p>` : '',
    e.conclusao ? `<p><b>Conclusão:</b> ${esc(e.conclusao)}</p>` : '',
  ].join('');
  return `<div class="exame">
    <div class="exame-topo">
      <strong>${esc(e.tipoExame)}</strong>
      ${etiqueta(st.label, st.cor, st.fundo)}
      ${e.temResultadoAnormal ? etiqueta('Anormal', colors.error, colors.errorSoft) : ''}
    </div>
    <div class="sub">${[formatarData(dataExame(e)), e.unidadeSanitariaNome, e.medicoResponsavelNome]
      .filter((x) => x && x !== '—')
      .map((x) => esc(x))
      .join(' · ')}</div>
    ${laudo}${tabela}
  </div>`;
}

export function gerarHtmlHistorico(h: HistoricoClinico): string {
  const { paciente: p, condicoes, exames, prescricoes } = h;
  const alergias = condicoes.filter((c) => c.tipo === 'ALERGIA');
  const cronicas = condicoes.filter((c) => c.tipo === 'DOENCA_CRONICA');
  const ativas = prescricoes.filter((x) => x.ativa);
  const encerradas = prescricoes.filter((x) => !x.ativa);
  const examesOrdenados = [...exames].sort((a, b) => dataExame(b).localeCompare(dataExame(a)));

  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Histórico clínico · ${esc(p.codUnico)}</title>
<style>
  @page { margin: 18mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; color: ${colors.text}; font-size: 11px; margin: 0; }
  header { border-bottom: 3px solid ${colors.primary}; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-end; }
  .marca { color: ${colors.primary}; font-size: 20px; font-weight: 700; }
  .doc { color: ${colors.textSecondary}; font-size: 10px; text-align: right; }
  h1 { font-size: 16px; color: ${colors.primaryDark}; margin: 0 0 4px; }
  h2 { font-size: 13px; color: ${colors.primaryDark}; margin: 18px 0 6px; padding-bottom: 4px; border-bottom: 1px solid ${colors.border}; }
  h3 { font-size: 11px; margin: 10px 0 4px; color: ${colors.textSecondary}; text-transform: uppercase; letter-spacing: .4px; }
  .grelha { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px 16px; background: ${colors.primaryFaint}; border-radius: 8px; padding: 10px 12px; }
  .grelha b { display: block; color: ${colors.textSecondary}; font-weight: 500; font-size: 9px; text-transform: uppercase; }
  .alertas { margin-top: 8px; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; page-break-inside: auto; }
  tr { page-break-inside: avoid; }
  th { text-align: left; font-size: 9px; text-transform: uppercase; color: ${colors.textSecondary}; border-bottom: 1px solid ${colors.border}; padding: 5px 6px; }
  td { padding: 6px; border-bottom: 1px solid ${colors.border}; vertical-align: top; }
  .sub { color: ${colors.textSecondary}; font-size: 10px; margin-top: 2px; }
  .tag { display: inline-block; padding: 1px 7px; border-radius: 10px; font-size: 9px; font-weight: 600; margin-right: 4px; }
  .vazio { color: ${colors.textSecondary}; font-style: italic; }
  .exame { border: 1px solid ${colors.border}; border-radius: 8px; padding: 8px 10px; margin-bottom: 8px; page-break-inside: avoid; }
  .exame-topo { display: flex; gap: 6px; align-items: center; }
  .exame p { margin: 4px 0; }
  .resultados th, .resultados td { padding: 4px 6px; }
  footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid ${colors.border}; color: ${colors.textSecondary}; font-size: 9px; }
</style>
</head>
<body>
  <header>
    <div class="marca">SAUDEID</div>
    <div class="doc">Histórico clínico completo<br/>Gerado em ${formatarDataHora(new Date().toISOString())}</div>
  </header>

  <h1>${esc(p.nomeCompleto)}</h1>
  <div class="grelha">
    <div><b>Código</b>${esc(p.codUnico)}</div>
    <div><b>Data de nascimento</b>${formatarData(p.dataNascimento)}${p.idade != null ? ` (${p.idade} anos)` : ''}</div>
    <div><b>Sexo</b>${esc(p.genero)}</div>
    <div><b>Tipo sanguíneo</b>${esc(tipoSanguineo(p.grupoSanguineo, p.fatorRh))}</div>
    <div><b>Telefone</b>${esc(p.telefone)}</div>
    <div><b>Contacto de emergência</b>${esc(p.contactoEmergencia)}</div>
    <div><b>Cidade</b>${esc(p.cidade)}</div>
  </div>
  <div class="alertas">
    ${h.diabetico ? etiqueta('Diabético', colors.error, colors.errorSoft) : ''}
    ${alergias.some((a) => a.severidade === 'CRITICA') ? etiqueta('Alergia crítica', colors.error, colors.errorSoft) : ''}
    ${ativas.length > 0 ? etiqueta(`${ativas.length} medicamento(s) ativo(s)`, colors.purple, colors.purpleSoft) : ''}
  </div>

  <h2>Alergias (${alergias.length})</h2>
  ${tabelaCondicoes(alergias, 'Nenhuma alergia registada')}

  <h2>Condições crónicas (${cronicas.length})</h2>
  ${tabelaCondicoes(cronicas, 'Nenhuma condição registada')}

  <h2>Prescrições</h2>
  <h3>Ativas (${ativas.length})</h3>
  ${tabelaPrescricoes(ativas, 'Sem prescrições ativas')}
  ${encerradas.length > 0 ? `<h3>Encerradas (${encerradas.length})</h3>${tabelaPrescricoes(encerradas, '')}` : ''}

  <h2>Exames (${exames.length})</h2>
  ${examesOrdenados.length === 0 ? '<p class="vazio">Ainda não há exames registados.</p>' : examesOrdenados.map(blocoExame).join('')}

  <footer>
    Documento confidencial com dados de saúde. Gerado pela aplicação SaudeId a partir dos registos disponíveis
    no momento da exportação; não substitui a avaliação clínica.
  </footer>
</body>
</html>`;
}

/** Gera o PDF do histórico e abre a folha de partilha (guardar, enviar, imprimir) */
export async function exportarHistoricoPdf(h: HistoricoClinico): Promise<void> {
  const html = gerarHtmlHistorico(h);

  // Na web, printToFileAsync só abre a janela de impressão do browser
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: `Histórico clínico · ${h.paciente.codUnico}`,
    });
  } else {
    await Print.printAsync({ uri });
  }
}
