/**
 * LLM Service for generating customer summaries
 * Supports Hugging Face API and local Ollama
 */

const generateSummary = async (customerData) => {
  const provider = process.env.SUMMARY_PROVIDER || 'hf';

  if (provider === 'ollama') {
    return await generateSummaryOllama(customerData);
  } else if (provider === 'hf') {
    return await generateSummaryHuggingFace(customerData);
  } else {
    throw new Error(`Unknown SUMMARY_PROVIDER: ${provider}`);
  }
};

/**
 * Generate summary using Hugging Face Inference API
 */
const generateSummaryHuggingFace = async (customerData) => {
  const apiKey = process.env.HF_API_KEY;
  if (!apiKey || apiKey === 'YOUR_HF_TOKEN') {
    console.warn('HF_API_KEY not configured. Using placeholder summary.');
    return generatePlaceholderSummary(customerData);
  }

  try {
    const prompt = buildPrompt(customerData);
    const response = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 150,
            do_sample: false,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HF API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    // Extract generated text from response
    if (Array.isArray(result) && result[0] && result[0].generated_text) {
      // Remove the prompt from the generated text
      let summary = result[0].generated_text;
      if (summary.includes(prompt)) {
        summary = summary.substring(summary.indexOf(prompt) + prompt.length).trim();
      }
      return summary.substring(0, 300); // Limit to 300 chars
    }

    return generatePlaceholderSummary(customerData);
  } catch (err) {
    console.error('HuggingFace LLM error:', err.message);
    return generatePlaceholderSummary(customerData);
  }
};

/**
 * Generate summary using local Ollama instance
 */
const generateSummaryOllama = async (customerData) => {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';

  try {
    const prompt = buildPrompt(customerData);
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama2', // or mistral, neural-chat, etc.
        prompt: prompt,
        stream: false,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const result = await response.json();
    if (result.response) {
      return result.response.substring(0, 300);
    }

    return generatePlaceholderSummary(customerData);
  } catch (err) {
    console.error('Ollama LLM error:', err.message);
    return generatePlaceholderSummary(customerData);
  }
};

/**
 * Build prompt from customer data
 */
const buildPrompt = (customerData) => {
  const parts = [];
  
  if (customerData.firstName && customerData.lastName) {
    parts.push(`${customerData.firstName} ${customerData.lastName}`);
  }
  
  if (customerData.age) {
    parts.push(`age ${customerData.age}`);
  }
  
  if (customerData.nationality) {
    parts.push(`from ${customerData.nationality}`);
  }
  
  if (customerData.gender) {
    parts.push(`gender: ${customerData.gender}`);
  }
  
  if (customerData.notes) {
    parts.push(`notes: ${customerData.notes}`);
  }

  const info = parts.join(', ');
  
  return `Create a brief 1-2 sentence professional customer summary for KYC verification: ${info}. Summary:`;
};

/**
 * Generate a simple placeholder summary when LLM is not available
 */
const generatePlaceholderSummary = (customerData) => {
  const name = `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim();
  const age = customerData.age ? ` age ${customerData.age}` : '';
  const nationality = customerData.nationality ? ` from ${customerData.nationality}` : '';
  
  return `${name}${age}${nationality} - Customer registered for KYC verification.`;
};

module.exports = {
  generateSummary,
};
