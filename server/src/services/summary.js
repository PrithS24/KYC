const axios = require('axios');

function buildPrompt(d) {
  const name = `${d.firstName} ${d.lastName}`.trim();
  return `Write exactly ONE concise professional sentence summarizing this KYC profile with no extra commentary:
Name: ${name}; Email: ${d.email}; Phone: ${d.phone || 'N/A'};
DOB: ${d.dateOfBirth ? new Date(d.dateOfBirth).toISOString().slice(0,10) : 'N/A'};
Nationality: ${d.nationality || 'N/A'}; Gender: ${d.gender || 'N/A'}; Age: ${d.age ?? 'N/A'};
Notes: ${d.notes || 'None'}.
Only output the single sentence.`;
}

function postprocess(raw = '') {
  const first = String(raw).split(/\r?\n/).join(' ').split('. ')[0].trim();
  if (!first) return '';
  return first.endsWith('.') ? first : first + '.';
}

async function summarizeHF(prompt, apiKey) {
  const url = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct';
  const res = await axios.post(
    url,
    { inputs: prompt, parameters: { max_new_tokens: 50 } },
    { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 20000 }
  );
  const data = res.data;
  const text = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
  return postprocess(text);
}

async function summarizeOllama(prompt, baseUrl) {
  const res = await axios.post(
    `${baseUrl || 'http://localhost:11434'}/api/generate`,
    { model: 'mistral', prompt, stream: false },
    { timeout: 20000 }
  );
  return postprocess(res.data?.response);
}

async function generateSummary(data, env) {
  const prompt = buildPrompt(data);
  try {
    if (env.SUMMARY_PROVIDER === 'ollama') {
      return await summarizeOllama(prompt, env.OLLAMA_URL);
    }
    if (!env.HF_API_KEY) return '';
    return await summarizeHF(prompt, env.HF_API_KEY);
  } catch (e) {
    console.error('LLM summary failed:', e?.response?.data || e.message);
    return ''; // save without summary if LLM fails
  }
}

module.exports = { generateSummary };
