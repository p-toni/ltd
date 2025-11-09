#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, relative, sep, resolve } from 'node:path';

const PRIORITY_ORDER = ['critical', 'high', 'medium', 'low'];
const GLOB_SPECIAL = /[.+^${}()|[\]\\]/g;

function toPosixPath(target) {
  return target.split(sep).join('/');
}

function globToRegex(glob) {
  const escaped = glob.replace(GLOB_SPECIAL, '\\$&');
  const normalized = escaped
    .replace(/\\\*\\\*/g, '::DOUBLE_STAR::')
    .replace(/\\\*/g, '[^/]*')
    .replace(/::DOUBLE_STAR::/g, '.*')
    .replace(/\\\?/g, '.');
  return new RegExp(`^${normalized}$`);
}

function matchesPattern(patterns = [], relativePath, absolutePath) {
  if (!patterns.length) return false;
  return patterns.some(pattern => {
    const regex = globToRegex(pattern);
    return regex.test(relativePath) || regex.test(absolutePath);
  });
}

function loadSkillRules(projectDir) {
  const rulesPath = join(projectDir, '.claude', 'skills', 'skill-rules.json');
  return JSON.parse(readFileSync(rulesPath, 'utf-8'));
}

function getStatePath(projectDir, sessionId) {
  const stateDir = join(projectDir, '.claude', 'hooks', 'state');
  mkdirSync(stateDir, { recursive: true });
  return join(stateDir, `skills-used-${sessionId}.json`);
}

function loadState(statePath) {
  if (!existsSync(statePath)) {
    return { skills_used: [] };
  }
  try {
    return JSON.parse(readFileSync(statePath, 'utf-8'));
  } catch (err) {
    console.error('skill-verification-guard: failed to parse state file', err);
    return { skills_used: [] };
  }
}

function saveState(statePath, state) {
  writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function pickHighestPriority(matches) {
  return matches.sort((a, b) => {
    const aIdx = PRIORITY_ORDER.indexOf(a.config.priority || 'low');
    const bIdx = PRIORITY_ORDER.indexOf(b.config.priority || 'low');
    return aIdx - bIdx;
  })[0];
}

function formatBlockMessage(config, skillName, relativePath) {
  const base = config.blockMessage || `⚠️ ${skillName} required before editing {file_path}`;
  return base
    .replaceAll('{file_path}', relativePath)
    .replace(/\\n/g, '\n');
}

function matchesContent(patterns = [], filePath) {
  if (!patterns.length) return true;
  try {
    const content = readFileSync(filePath, 'utf-8');
    return patterns.some(pattern => {
      try {
        const regex = new RegExp(pattern, 'm');
        return regex.test(content);
      } catch (err) {
        console.error(`skill-verification-guard: invalid content pattern '${pattern}'`, err);
        return false;
      }
    });
  } catch (err) {
    // Fail open silently when file cannot be read
    return false;
  }
}

function main() {
  try {
    const rawInput = readFileSync(0, 'utf-8');
    const input = JSON.parse(rawInput);

    if (process.env.SKIP_SKILL_GUARDRAILS) {
      process.exit(0);
    }

    const toolName = input.tool_name || '';
    if (!/^(Edit|MultiEdit|Write)$/.test(toolName)) {
      process.exit(0);
    }

    const filePath = input.tool_input?.file_path;
    if (!filePath) {
      process.exit(0);
    }

    const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
    const absFilePath = resolve(filePath);
    const relativePathRaw = relative(projectDir, absFilePath);
    const relativePath = relativePathRaw.startsWith('..') ? toPosixPath(absFilePath) : toPosixPath(relativePathRaw);
    const rules = loadSkillRules(projectDir);

    const matches = [];

    for (const [skillName, config] of Object.entries(rules.skills || {})) {
      if (config.enforcement !== 'block') {
        continue;
      }
      const triggers = config.fileTriggers;
      if (!triggers) {
        continue;
      }

      if (triggers.pathExclusions && matchesPattern(triggers.pathExclusions, relativePath, absFilePath)) {
        continue;
      }

      if (triggers.pathPatterns && !matchesPattern(triggers.pathPatterns, relativePath, absFilePath)) {
        continue;
      }

      if (triggers.contentPatterns && !matchesContent(triggers.contentPatterns, absFilePath)) {
        continue;
      }

      matches.push({ name: skillName, config });
    }

    if (matches.length === 0) {
      process.exit(0);
    }

    const match = pickHighestPriority(matches);
    const sessionId = input.session_id || 'default';
    const statePath = getStatePath(projectDir, sessionId);
    const state = loadState(statePath);

    if (state.skills_used.includes(match.name)) {
      process.exit(0);
    }

    state.skills_used.push(match.name);
    saveState(statePath, state);

    const message = formatBlockMessage(match.config, match.name, relativePath);
    console.error(message);
    process.exit(2);
  } catch (error) {
    console.error('skill-verification-guard: error', error);
    process.exit(0);
  }
}

main();
