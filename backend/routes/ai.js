const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

async function callLLM(messages) {
  const url = process.env.AI_GATEWAY_URL;
  const token = process.env.HUGGINGFACE_TOKEN;
  const model = process.env.AI_MODEL || 'Meta-Llama-3.3-70B-Instruct';

  if (!url || !token) {
    throw new Error('AI_GATEWAY_URL and HUGGINGFACE_TOKEN must be set');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`AI API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// POST /api/ai/group-themes
router.post('/group-themes', auth, async (req, res) => {
  try {
    const { tasks } = req.body;
    if (!tasks || tasks.length < 4) {
      return res.json({ groups: [] });
    }

    const taskList = tasks.map(t => `${t.id}. ${t.text} [${t.category}, ${t.priority}]`).join('\n');

    const messages = [
      {
        role: 'system',
        content: 'You are a task organizer. Given a list of tasks, cluster them into thematic groups based on their meaning and content. Each task belongs to exactly one group. Create meaningful, specific group names based on what the tasks are actually about (e.g. "Errands", "Health & Fitness", "Client Work", "Home Maintenance", "Finance", "Learning", "Social"). Do NOT use generic categories like "Personal" or "Professional". Aim for 2-5 groups depending on variety. Respond ONLY with valid JSON in this exact format, no other text: {"groups": [{"theme": "Group Name", "taskIds": [1, 2]}, ...]}'
      },
      {
        role: 'user',
        content: `Cluster these tasks into thematic groups:\n${taskList}`
      }
    ];

    const result = await callLLM(messages);
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return res.json(parsed);
    }
    res.json({ groups: [] });
  } catch (err) {
    console.error('Theme grouping error:', err);
    res.status(500).json({ error: 'Failed to group tasks by theme' });
  }
});

// POST /api/ai/daily-briefing
router.post('/daily-briefing', auth, async (req, res) => {
  try {
    const { tasks, today, weather } = req.body;
    if (!tasks || tasks.length === 0) {
      const weatherNote = weather ? ` ${weather}` : '';
      return res.json({ briefing: `No active tasks right now. Enjoy your free day!${weatherNote}` });
    }

    const taskList = tasks.map(t => {
      const dateLabel = t.date === today ? '(today)' : t.date ? `(${t.date})` : '(no date)';
      return `- [${t.priority}, ${t.category}] ${t.text} ${dateLabel} (${t.status.replace(/_/g, ' ')})`;
    }).join('\n');

    const weatherContext = weather
      ? `\n\nWeather context: ${weather}\nIf any tasks could be impacted by weather (outdoor activities, commuting, sports, errands), briefly mention the weather impact.`
      : '';

    const messages = [
      {
        role: 'system',
        content: `Write a very short daily task note (1-2 lines max). Today: ${today || 'unknown'}. Format like a sticky note — e.g. "5 tasks, 2 high-pri. Focus: client report. Rain today, plan indoor." No markdown, no bullets, no greetings. Ultra-concise.${weatherContext}`
      },
      {
        role: 'user',
        content: `Here are the active tasks:\n${taskList}`
      }
    ];

    const result = await callLLM(messages);
    res.json({ briefing: result.trim() });
  } catch (err) {
    console.error('Daily briefing error:', err);
    res.status(500).json({ error: 'Failed to generate briefing' });
  }
});

// POST /api/ai/infer-location
router.post('/infer-location', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.json({ location: null });

    const messages = [
      {
        role: 'system',
        content: 'Given a task description, infer the most likely location type where this task would be done (e.g. "Pharmacy", "Grocery Store", "Office", "Gym", "Bank", "Hospital", "Home", "Post Office", "School"). If no clear location can be inferred, respond with exactly "none". Respond ONLY with the location name, nothing else.'
      },
      {
        role: 'user',
        content: text
      }
    ];

    const result = await callLLM(messages);
    const loc = result.trim();
    res.json({ location: loc.toLowerCase() === 'none' ? null : loc });
  } catch (err) {
    console.error('Location inference error:', err);
    res.json({ location: null });
  }
});

module.exports = router;
