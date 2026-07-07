const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

async function callLLM(messages, maxTokens = 1024) {
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
      max_tokens: maxTokens
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
    const { tasks, today, weather, overdueTasks, completedCount, totalCount, weekTasks, isWeekend, isHoliday, holidayName, dayOfWeek } = req.body;

    if ((!tasks || tasks.length === 0) && (!overdueTasks || overdueTasks.length === 0)) {
      const weatherNote = weather ? ` ${weather}` : '';
      return res.json({
        summary: `No active tasks right now. Enjoy your free day!${weatherNote}`,
        workPlan: [],
        alerts: [],
        recommendations: []
      });
    }

    // Build rich task context
    const todayTasks = (tasks || []).filter(t => t.date === today);
    const futureTasks = (tasks || []).filter(t => t.date && t.date > today);
    const overdueList = overdueTasks || [];

    let taskContext = '';

    if (overdueList.length > 0) {
      taskContext += `OVERDUE TASKS (${overdueList.length}):\n`;
      taskContext += overdueList.map(t => {
        const loc = t.location ? ` [Location: ${t.location}]` : '';
        return `- [${t.priority}] ${t.text} (due: ${t.date})${loc}`;
      }).join('\n');
      taskContext += '\n\n';
    }

    if (todayTasks.length > 0) {
      taskContext += `TODAY'S TASKS (${todayTasks.length}):\n`;
      taskContext += todayTasks.map(t => {
        const loc = t.location ? ` [Location: ${t.location}]` : '';
        return `- [${t.priority}, ${t.status.replace(/_/g, ' ')}] ${t.text}${loc}`;
      }).join('\n');
      taskContext += '\n\n';
    }

    if (futureTasks.length > 0) {
      taskContext += `UPCOMING TASKS (${futureTasks.length}):\n`;
      taskContext += futureTasks.slice(0, 10).map(t => {
        const loc = t.location ? ` [Location: ${t.location}]` : '';
        return `- [${t.priority}] ${t.text} (${t.date})${loc}`;
      }).join('\n');
      taskContext += '\n\n';
    }

    // Week workload context
    if (weekTasks) {
      taskContext += `WEEK WORKLOAD:\n`;
      for (const [day, count] of Object.entries(weekTasks)) {
        taskContext += `  ${day}: ${count} tasks\n`;
      }
      taskContext += '\n';
    }

    const completionContext = totalCount > 0
      ? `Completion rate: ${completedCount}/${totalCount} tasks done (${Math.round(completedCount / totalCount * 100)}%).`
      : '';

    const dayContext = [
      `Today: ${today} (${dayOfWeek || 'unknown'})`,
      isWeekend ? 'It is a WEEKEND.' : '',
      isHoliday ? `It is a HOLIDAY: ${holidayName}.` : '',
      completionContext
    ].filter(Boolean).join(' ');

    const weatherContext = weather
      ? `Weather: ${weather}`
      : '';

    const systemPrompt = `You are a smart personal productivity assistant for a task/reminder app. Generate a structured daily briefing as a JSON object.

Context:
${dayContext}
${weatherContext}

Rules:
1. "summary": A concise 1-2 sentence overview of the day (what to focus on, mood-setting).
2. "workPlan": An ordered array of 2-5 action items for the day. Each item: {"task": "description", "why": "brief reason", "timeHint": "suggested time like Morning/Afternoon/Evening"}. Prioritize: overdue first, then high-priority today tasks, then quick wins. If weekend/holiday, suggest lighter work and personal tasks. Group tasks at the same location together.
3. "alerts": Array of 0-3 short warning strings. Include if: tasks are overdue, a day this week is overloaded (5+ tasks), weather impacts outdoor tasks, high-priority deadlines approaching.
4. "recommendations": Array of 1-3 smart suggestions. Examples: reschedule overloaded days, batch errands at same location, take a break if productivity is high, tackle a specific overdue task, balance personal vs professional, suggest weekend catch-up for overdue items.

${isWeekend || isHoliday ? 'Since it is a weekend/holiday: recommend rest, light personal tasks only, suggest catching up on overdue items if any, and defer professional tasks to weekdays unless urgent.' : 'It is a workday: prioritize professional tasks during work hours, suggest personal tasks for evening.'}

Respond ONLY with valid JSON, no markdown, no extra text. Format:
{"summary":"...","workPlan":[{"task":"...","why":"...","timeHint":"..."}],"alerts":["..."],"recommendations":["..."]}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: taskContext }
    ];

    const result = await callLLM(messages, 1500);
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return res.json({
          summary: parsed.summary || '',
          workPlan: Array.isArray(parsed.workPlan) ? parsed.workPlan : [],
          alerts: Array.isArray(parsed.alerts) ? parsed.alerts : [],
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : []
        });
      } catch {}
    }
    // Fallback: return raw text as summary
    res.json({ summary: result.trim(), workPlan: [], alerts: [], recommendations: [] });
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

// POST /api/ai/health-coach
router.post('/health-coach', auth, async (req, res) => {
  try {
    const { message, history, trackers, weather } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    // Build tracker context
    let trackerContext = '';
    if (trackers) {
      const parts = [];
      if (trackers.water != null) parts.push(`Water intake today: ${trackers.water} glasses (goal: ${trackers.waterGoal || 8})`);
      if (trackers.sleep != null) parts.push(`Sleep last night: ${trackers.sleep} hours`);
      if (trackers.steps != null) parts.push(`Steps today: ${trackers.steps} (goal: ${trackers.stepsGoal || 10000})`);
      if (trackers.meals && trackers.meals.length > 0) parts.push(`Meals logged today: ${trackers.meals.join(', ')}`);
      if (trackers.mood) parts.push(`Current mood: ${trackers.mood}`);
      if (trackers.exercise && trackers.exercise.length > 0) parts.push(`Exercise today: ${trackers.exercise.join(', ')}`);
      if (parts.length > 0) trackerContext = '\n\nUser\'s health data today:\n' + parts.join('\n');
    }

    const weatherContext = weather ? `\nCurrent weather: ${weather}` : '';

    const systemPrompt = `You are a real-time personal health coach designed to remove the guesswork from staying healthy in everyday life.
Your role is to provide clear, actionable, and personalized guidance across nutrition, fitness, sleep, hydration, and mental well-being.

Core objectives:
- Offer real-time nutritional advice based on user inputs (meals, cravings, allergies, goals).
- Suggest fitness routines adapted to user's current energy, environment, and available time.
- Provide hydration and sleep reminders tuned to lifestyle and activity levels.
- Deliver mental wellness nudges (breathing exercises, mindfulness, stress relief tips).
- Track progress and highlight patterns (e.g., skipped meals, late nights, hydration gaps).
- Encourage sustainable habits rather than quick fixes.

Guidelines:
- Always explain the *why* behind recommendations to build trust and understanding.
- Keep advice practical, simple, and tailored to real-life scenarios.
- Avoid medical diagnoses; focus on preventive, everyday wellness coaching.
- Use motivational, supportive language that feels like a coach, not a textbook.
- Adapt tone: concise for quick nudges, detailed for deeper guidance.
${trackerContext}${weatherContext}

Respond ONLY with valid JSON in this exact format, no markdown, no extra text:
{"recommendation":"short actionable step","reasoning":"why this matters right now","tips":["optional extra tip 1","optional extra tip 2"],"trackerNudge":"optional nudge about their tracked data or null"}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).slice(-6),
      { role: 'user', content: message }
    ];

    const result = await callLLM(messages, 1200);
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return res.json({
          recommendation: parsed.recommendation || '',
          reasoning: parsed.reasoning || '',
          tips: Array.isArray(parsed.tips) ? parsed.tips : [],
          trackerNudge: parsed.trackerNudge || null
        });
      } catch {}
    }
    // Fallback: return raw text
    res.json({ recommendation: result.trim(), reasoning: '', tips: [], trackerNudge: null });
  } catch (err) {
    console.error('Health coach error:', err);
    res.status(500).json({ error: 'Failed to get health advice' });
  }
});

// POST /api/ai/analyze-meal-photo
router.post('/analyze-meal-photo', auth, async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'Image is required' });

    const token = process.env.HUGGINGFACE_TOKEN;
    if (!token) throw new Error('HUGGINGFACE_TOKEN must be set');

    // Step 1: Caption the image using HuggingFace vision model
    const imageBuffer = Buffer.from(image, 'base64');
    const captionResp = await fetch(
      'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large',
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: imageBuffer
      }
    );

    if (!captionResp.ok) throw new Error(`Image captioning failed: ${captionResp.status}`);
    const captionData = await captionResp.json();
    const caption = captionData[0]?.generated_text || 'unidentified food';

    // Step 2: Use LLM to analyze nutrition based on caption
    const messages = [
      {
        role: 'system',
        content: `You are a nutrition analysis AI. Given a description of a meal from a photo, identify foods, estimate portions, and calculate nutritional values. Be practical and estimate reasonable serving sizes.

Respond ONLY with valid JSON:
{"foods":[{"name":"food name","portion":"estimated portion","calories":number,"protein":number,"carbs":number,"fat":number}],"totalCalories":number,"summary":"brief meal summary","advice":"one actionable health tip about this meal","reasoning":"why this advice matters"}`
      },
      {
        role: 'user',
        content: `Analyze this meal from the photo description: "${caption}". Identify foods, estimate portions, and provide nutritional breakdown.`
      }
    ];

    const result = await callLLM(messages, 800);
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return res.json({
          caption,
          foods: Array.isArray(parsed.foods) ? parsed.foods : [],
          totalCalories: parsed.totalCalories || 0,
          summary: parsed.summary || caption,
          advice: parsed.advice || '',
          reasoning: parsed.reasoning || ''
        });
      } catch {}
    }
    res.json({ caption, foods: [], totalCalories: 0, summary: caption, advice: '', reasoning: '' });
  } catch (err) {
    console.error('Meal photo analysis error:', err);
    res.status(500).json({ error: 'Failed to analyze meal photo' });
  }
});

// POST /api/ai/parse-voice-meal
router.post('/parse-voice-meal', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const messages = [
      {
        role: 'system',
        content: `You are a nutrition parser. Given a natural language description of what someone ate, extract individual food items with estimated nutritional values per typical serving.

Respond ONLY with valid JSON:
{"meals":[{"name":"food name","calories":number,"protein":number,"carbs":number,"fat":number}],"totalCalories":number,"advice":"brief actionable health tip","reasoning":"why this matters"}`
      },
      {
        role: 'user',
        content: `Parse this meal description and estimate nutrition: "${text}"`
      }
    ];

    const result = await callLLM(messages, 600);
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return res.json({
          meals: Array.isArray(parsed.meals) ? parsed.meals : [],
          totalCalories: parsed.totalCalories || 0,
          advice: parsed.advice || '',
          reasoning: parsed.reasoning || ''
        });
      } catch {}
    }
    res.json({ meals: [{ name: text, calories: 0, protein: 0, carbs: 0, fat: 0 }], totalCalories: 0, advice: '', reasoning: '' });
  } catch (err) {
    console.error('Voice meal parse error:', err);
    res.status(500).json({ error: 'Failed to parse meal' });
  }
});

// POST /api/ai/meal-advice
router.post('/meal-advice', auth, async (req, res) => {
  try {
    const { meal, trackers, timeOfDay } = req.body;
    if (!meal) return res.status(400).json({ error: 'Meal is required' });

    let context = `Time: ${timeOfDay || 'unknown'}`;
    if (trackers) {
      if (trackers.water != null) context += `\nWater: ${trackers.water}/${trackers.waterGoal || 8} glasses`;
      if (trackers.meals) context += `\nMeals today: ${trackers.meals.length} (${trackers.meals.join(', ')})`;
      if (trackers.exercise) context += `\nExercise: ${trackers.exercise.length} activities`;
      if (trackers.mood) context += `\nMood: ${trackers.mood}`;
      if (trackers.sleep != null) context += `\nSleep: ${trackers.sleep} hrs`;
    }

    const messages = [
      {
        role: 'system',
        content: `You are a supportive health coach providing immediate advice after a meal is logged. Always explain WHY your advice matters. Be concise, motivational, and practical.

User context:
${context}

Respond ONLY with valid JSON:
{"recommendation":"short actionable step","reasoning":"why this matters right now","tip":"bonus tip or alternative strategy"}`
      },
      {
        role: 'user',
        content: `I just ate: ${meal}. Give me quick coaching advice.`
      }
    ];

    const result = await callLLM(messages, 400);
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return res.json({
          recommendation: parsed.recommendation || '',
          reasoning: parsed.reasoning || '',
          tip: parsed.tip || ''
        });
      } catch {}
    }
    res.json({ recommendation: '', reasoning: '', tip: '' });
  } catch (err) {
    console.error('Meal advice error:', err);
    res.status(500).json({ error: 'Failed to generate advice' });
  }
});

module.exports = router;
