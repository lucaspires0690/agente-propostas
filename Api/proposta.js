export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'Chave API não configurada no servidor.' });
  }

  const { anuncio, plataforma, intensidade, modelo } = req.body;

  if (!anuncio || anuncio.length < 20) {
    return res.status(400).json({ error: 'Anúncio inválido ou muito curto.' });
  }

  const modeloFinal = modelo || 'llama-3.3-70b-versatile';

  const prompt = `Você é especialista em marketing persuasivo, copywriting e psicologia do consumidor para freelancers brasileiros.

Crie uma proposta IRRESISTÍVEL para Lucas Pires responder a um anúncio de transcrição.

PERFIL DE LUCAS PIRES:
- Especialidade: Transcrição especializada com diarização de falantes
- Diferenciais:
  * Identificação de cada falante com nome (diarização completa)
  * Documento Word PRONTO — zero retrabalho para o cliente
  * Formatação ABNT incluída em todos os projetos
  * Sigilo absoluto — processamento local, arquivos nunca enviados a servidores externos
  * Entrega em até 24h por hora de áudio
  * Revisão técnica humanizada especializada por nicho
  * Formatos: DOCX, TXT, SRT — cliente escolhe
- Nichos: psicólogos, terapeutas, podcasters, criadores de conteúdo, professores, EAD
- REGRA ABSOLUTA: NUNCA mencionar IA, automação, robô ou software. Lucas é visto como especialista humano com metodologia própria.
- Plataforma: ${plataforma === 'auto' ? 'detectar pelo contexto' : plataforma}
- Intensidade persuasiva: ${intensidade}

ANÚNCIO DO CLIENTE:
${anuncio}

INSTRUÇÕES:

Analise internamente:
- Nicho/segmento do cliente
- Dor principal explícita e dor implícita
- Arquétipo dominante do cliente
- Tom adequado

Estrutura da proposta:
1. Abertura que espelha a DOR (não fale de Lucas ainda)
2. Frase de autoridade que apresenta Lucas como solução ideal
3. 3-4 diferenciais RELEVANTES para este projeto específico
4. Detalhe que prova que Lucas leu o anúncio com atenção
5. CTA que convida resposta imediata

Regras obrigatórias:
- 180-280 palavras
- NUNCA mencione IA, automação, software de transcrição
- NUNCA genérico — personalize para este cliente
- Use {b}texto{/b} para negrito quando aplicável
- Comece pela dor do cliente, não por "Olá, me chamo Lucas"
- Termine com pergunta ou CTA que convida resposta
- Tom confiante, nunca desesperado ou bajulador

Gatilhos mentais (escolha os mais adequados):
- Especificidade, Autoridade, Prova social implícita, Sigilo/segurança, Reciprocidade

Arquétipos:
- Psicólogos/saúde: Governante (segurança, controle, confiança)
- Podcasters/criadores: Criador + Mago (transformação, multiplicação)
- Professores/EAD: Sábio (precisão, conhecimento, metodologia)

Responda EXATAMENTE neste formato:

NICHO: [nicho detectado]
ARQUETIPOS: [arquétipos usados]
TOM: [tom aplicado]
DOR_PRINCIPAL: [dor principal]
DOR_IMPLICITA: [dor implícita]
GATILHOS: [gatilhos aplicados]
DICA: [uma dica estratégica de 1 frase para este cliente]
---PROPOSTA---
[proposta completa pronta para copiar]`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: modeloFinal,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1200,
        temperature: 0.75
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(502).json({ error: err.error?.message || 'Erro ao chamar o Groq.' });
    }

    const data = await response.json();
    const texto = data.choices[0].message.content;

    return res.status(200).json({ resultado: texto });

  } catch (err) {
    return res.status(500).json({ error: `Erro interno: ${err.message}` });
  }
}
