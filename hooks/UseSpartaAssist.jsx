import { useCallback, useState } from "react";

const WS_URL = "wss://sparta-voice-backend-dev-001.azurewebsites.net/ws";

export function useSpartaAssistOnce() {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [error, setError] = useState(null);

  const askAssist = useCallback((description) => {
    if (!description?.trim()) return;

    setLoading(true);
    setSuggestion("");
    setError(null);

    const ws = new WebSocket(WS_URL);
    let result = "";

    const fullPrompt = `
You are a friendly and knowledgeable IT support assistant. Your tone is conversational, warm, and approachable — like a smart helpful friend who knows tech really well.

You specialize in IT support: troubleshooting, networking, software, hardware, cloud services, Microsoft 365, Azure, PowerApps, cybersecurity, and general tech advice. You adapt your language to match the user's level — simple for beginners, technical for experts.

ALWAYS respond using this exact HTML structure — no markdown, no plain text, only clean HTML:

<h2>[Short descriptive title of the issue]</h2>

<p>Start with a warm, empathetic sentence acknowledging the user's issue.</p>

<p><strong>Here are some steps to help resolve it:</strong></p>

<ol>
  <li><strong>Step name:</strong> Clear explanation of what to do and why.</li>
  <li><strong>Step name:</strong> Clear explanation of what to do and why.</li>
  <li><strong>Step name:</strong> Clear explanation of what to do and why.</li>
</ol>

<p>If the issue persists, it would help to know:</p>
<ul>
  <li>Relevant follow-up question 1?</li>
  <li>Relevant follow-up question 2?</li>
</ul>

<p>Friendly closing sentence encouraging the user. Use an emoji at the end 😊</p>

RULES:
- NEVER use markdown (no **, no #, no backticks)
- ALWAYS use the HTML structure above
- Be specific and practical — give real steps, not vague advice
- If the input is nonsense, too vague, or not an IT issue, respond with only this HTML:
  <p>Please provide a more detailed description of your issue so I can give you accurate troubleshooting steps. 😊</p>
- Maximum 8 steps in the <ol>
- You may include sub-bullets using <ul> inside an <li> for complex steps

Now help the user with this ticket:

Title: ${description.split('\n\n')[0]?.replace('Title: ', '') ?? ''}
Description: ${description.split('\n\n')[1]?.replace('Description: ', '') ?? description}
`;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: "user_text",
        text: fullPrompt
      }));
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        console.log("[SpartaAssist]", msg);

        if (msg.type === "error") {
          setError(msg.message);
          setLoading(false);
          ws.close();
          return;
        }

        if (msg.type === "provider_event") {
          const ev = msg.event;

          if (ev.type === "response.text.delta") {
            result += ev.delta ?? "";
            setSuggestion(result);
          }

          if (ev.type === "response.output_item.done") {
            const item = ev.item;
            if (item?.type === "message") {
              const textContent = item.content
                ?.filter(c => c.type === "text")
                ?.map(c => c.text)
                ?.join("") ?? "";
              if (textContent && !result) {
                setSuggestion(textContent);
              }
            }
          }

          if (ev.type === "response.audio_transcript.delta") {
            result += ev.delta ?? "";
            setSuggestion(result);
          }

          if (ev.type === "response.done" || ev.type === "response.cancelled") {
            if (!result) {
              const outputs = ev.response?.output ?? [];
              for (const out of outputs) {
                for (const content of out.content ?? []) {
                  if (content.transcript) result += content.transcript;
                  if (content.text) result += content.text;
                }
              }
              if (result) setSuggestion(result);
            }
            setLoading(false);
            ws.close();
          }
        }
      } catch (err) {
        console.error("[SpartaAssist] parse error", err);
      }
    };

    ws.onerror = (e) => {
      console.error("[SpartaAssist] WebSocket error", e);
      setError("Could not connect to Sparta Assist.");
      setLoading(false);
    };

    ws.onclose = (e) => {
      console.log("[SpartaAssist] closed", e.code, e.reason);
      setLoading(false);
    };
  }, []);

  const clear = useCallback(() => setSuggestion(""), []);

  return { askAssist, loading, suggestion, error, clear };
}