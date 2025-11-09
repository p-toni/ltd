#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const PRIORITY_ORDER = ['critical', 'high', 'medium', 'low'];

function groupMatches(matches) {
  return PRIORITY_ORDER.reduce((acc, key) => {
    acc[key] = matches.filter(match => match.config.priority === key);
    return acc;
  }, {});
}

function formatOutput(groups) {
  let output = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  output += '🎯 SKILL ACTIVATION CHECK\n';
  output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

  if (groups.critical.length > 0) {
    output += '⚠️ CRITICAL SKILLS (REQUIRED):\n';
    groups.critical.forEach(skill => {
      output += `  → ${skill.name}\n`;
    });
    output += '\n';
  }

  if (groups.high.length > 0) {
    output += '📚 RECOMMENDED SKILLS:\n';
    groups.high.forEach(skill => {
      output += `  → ${skill.name}\n`;
    });
    output += '\n';
  }

  if (groups.medium.length > 0) {
    output += '💡 SUGGESTED SKILLS:\n';
    groups.medium.forEach(skill => {
      output += `  → ${skill.name}\n`;
    });
    output += '\n';
  }

  if (groups.low.length > 0) {
    output += '📌 OPTIONAL SKILLS:\n';
    groups.low.forEach(skill => {
      output += `  → ${skill.name}\n`;
    });
    output += '\n';
  }

  output += 'ACTION: Use Skill tool BEFORE responding\n';
  output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  return output;
}

function main() {
  try {
    const rawInput = readFileSync(0, 'utf-8');
    const hookInput = JSON.parse(rawInput);
    const prompt = (hookInput.prompt || '').toLowerCase();

    if (!prompt) {
      process.exit(0);
    }

    const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    const rulesPath = join(projectDir, '.claude', 'skills', 'skill-rules.json');
    const rules = JSON.parse(readFileSync(rulesPath, 'utf-8'));
    const matchedSkills = [];

    for (const [skillName, config] of Object.entries(rules.skills || {})) {
      const triggers = config.promptTriggers;
      if (!triggers) continue;

      const keywordMatch = (triggers.keywords || []).some(keyword =>
        prompt.includes(keyword.toLowerCase())
      );

      if (keywordMatch) {
        matchedSkills.push({ name: skillName, matchType: 'keyword', config });
        continue;
      }

      const intentMatch = (triggers.intentPatterns || []).some(pattern => {
        try {
          const regex = new RegExp(pattern, 'i');
          return regex.test(prompt);
        } catch (error) {
          console.error(`Invalid intent pattern for skill ${skillName}:`, pattern, error);
          return false;
        }
      });

      if (intentMatch) {
        matchedSkills.push({ name: skillName, matchType: 'intent', config });
      }
    }

    if (matchedSkills.length === 0) {
      process.exit(0);
    }

    const groups = groupMatches(matchedSkills);
    console.log(formatOutput(groups));
    process.exit(0);
  } catch (error) {
    console.error('Error in skill-activation-prompt hook:', error);
    process.exit(1);
  }
}

main();
