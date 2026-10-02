function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, c => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'
  }[c]));
}

// Wraps numbers in <say-as interpret-as="cardinal"> so Azure reads them as
// real numbers. Must run AFTER escapeXml (see original comments in index.js).
function annotateNumbers(escapedText) {
  const numberRegex = /[०-९0-9]+(?:,[०-९0-9]+)*(?:\.[०-९0-9]+)?/g;
  return escapedText.replace(numberRegex, (match) => {
    if (match.includes('.')) {
      const [whole, frac] = match.split('.');
      const cleanWhole = whole.replace(/,/g, '');
      return `<say-as interpret-as="cardinal">${cleanWhole}</say-as> दशमलव <say-as interpret-as="cardinal">${frac}</say-as>`;
    }
    const clean = match.replace(/,/g, '');
    return `<say-as interpret-as="cardinal">${clean}</say-as>`;
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('POST only');

  const text = req.body && req.body.text;
  const voiceName = (req.body && req.body.voiceName) || 'ne-NP-HemkalaNeural';
  if (!text) return res.status(400).send('Please pass text in the request body');

  const apiKey = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION || 'eastus';
  if (!apiKey) return res.status(500).send('Server missing Azure API Key configuration.');

  const processedText = annotateNumbers(escapeXml(text));
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ne-NP"><voice name="${voiceName}"><lang xml:lang="ne-NP">${processedText}</lang></voice></speak>`;

  try {
    const azureRes = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'riff-16khz-16bit-mono-pcm',
        'User-Agent': 'LekhanStudio'
      },
      body: ssml
    });

    if (!azureRes.ok) {
      const errText = await azureRes.text();
      return res.status(azureRes.status).send('Azure Error: ' + errText);
    }

    const audioBuffer = Buffer.from(await azureRes.arrayBuffer());
    res.setHeader('Content-Type', 'audio/wav');
    return res.status(200).send(audioBuffer);
  } catch (e) {
    return res.status(500).send(e.message);
  }
};
