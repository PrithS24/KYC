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
    parts.push(`Name: ${customerData.firstName} ${customerData.lastName}`);
  }

  if (customerData.email) {
    parts.push(`Email: ${customerData.email}`);
  }

  if (customerData.phone) {
    parts.push(`Phone: ${customerData.phone}`);
  }

  if (customerData.dateOfBirth) {
    const dob = new Date(customerData.dateOfBirth).toISOString().slice(0, 10);
    parts.push(`DOB: ${dob}`);
  }

  if (customerData.age) {
    parts.push(`Age: ${customerData.age}`);
  }

  if (customerData.gender) {
    parts.push(`Gender: ${customerData.gender}`);
  }

  if (customerData.nationality) {
    parts.push(`Nationality: ${customerData.nationality}`);
  }

  if (customerData.yearlyIncome) {
    parts.push(`Yearly income: $${customerData.yearlyIncome}`);
  }

  if (customerData.currentAddress) {
    parts.push(`Current address: ${customerData.currentAddress}`);
  }

  if (customerData.permanentAddress) {
    parts.push(`Permanent address: ${customerData.permanentAddress}`);
  }

  if (customerData.notes) {
    parts.push(`Notes: ${customerData.notes}`);
  }

  const info = parts.join(', ');
  
  return `Create a brief 1-2 sentence professional KYC summary using ALL provided fields. Include identity, contact, location, income, and any notes in polished business tone. Details: ${info}. Summary:`;
};

/**
 * Generate a simple placeholder summary when LLM is not available
 */
const generatePlaceholderSummary = (customerData) => {
  const name = `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim() || 'Customer';
  const age = customerData.age ? `, age ${customerData.age}` : '';
  const gender = customerData.gender ? `, ${customerData.gender}` : '';
  const nat = customerData.nationality ? ` from ${customerData.nationality}` : '';
  const income = customerData.yearlyIncome ? ` | Income: $${customerData.yearlyIncome}` : '';
  const contact = customerData.email ? ` | Email: ${customerData.email}` : '';
  const phone = customerData.phone ? ` | Phone: ${customerData.phone}` : '';
  const addr = customerData.currentAddress ? ` | Address: ${customerData.currentAddress}` : '';
  return `${name}${age}${gender}${nat} registered for KYC verification.${income}${contact}${phone}${addr}`;
};

module.exports = {
  generateSummary,
};
