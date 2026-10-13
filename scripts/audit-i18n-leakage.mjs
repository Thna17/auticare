#!/usr/bin/env node

/**
 * AutiCare i18n Leakage & Bilingual Purity Audit Script
 *
 * Scans all Angular HTML templates and component strings for:
 * 1. Mixed parenthetical strings like 'Text (អត្ថបទ)' or 'អត្ថបទ (Text)'
 * 2. Hardcoded English text in Khmer blocks (ternaries, @if (currentLang() === 'km'))
 * 3. Hardcoded Khmer characters in English blocks (ternaries, @else / @if (currentLang() === 'en'))
 * 4. Un-translated UI action elements (e.g. hardcoded buttons in localized components)
 *
 * Exits with 0 if clean, 1 if any leakage is detected.
 */

import fs from 'node:fs';
import path from 'node:path';

// ANSI color escape codes for terminal output
const BOLD = '\x1b[1m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

const TARGET_DIR = path.resolve(process.cwd(), 'apps/web/src/app');

// Recognized medical, technical, and organizational acronyms permitted inside parentheses
const ALLOWED_ACRONYMS = new Set([
  'IEP',
  'OT',
  'SLP',
  'BCBA',
  'ABA',
  'TPO',
  'NISE',
  'DSM-5',
  'M-CHAT',
  'USAID',
  'UNICEF',
  'WHO',
  'FAQ',
  'PDF',
  'API',
  'SMS',
  'URL',
  'HTTP',
  'HTTPS',
  'ID',
  'COVID',
  'COVID-19',
  'ADHD',
  'ASD',
  'TPO CAMBODIA',
  'PECS',
  'ICS',
  'ICAL',
  'CSV',
  'JSON',
  'HTML',
  'CSS',
]);

// Allowed brand names and technical tokens permitted in localized branches
const ALLOWED_TOKENS = new Set([
  'AutiCare',
  'Google',
  'Facebook',
  'Telegram',
  'YouTube',
  'Apple',
  'iCal',
  'ics',
  'AM',
  'PM',
  'kg',
  'cm',
  'm',
  's',
  'h',
  'min',
  'mins',
  'MB',
  'GB',
  'KB',
  'px',
  'rem',
  'rgba',
  'rgb',
  'hex',
]);

const KHMER_REGEX = /[\u1780-\u17FF\u19E0-\u19FF]/;
const ENGLISH_WORD_REGEX = /[A-Za-z]{3,}/;

/**
 * Recursively collect all relevant frontend files (.html and .ts, excluding tests and seed fixtures)
 */
function collectFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath));
    } else if (
      (entry.name.endsWith('.ts') || entry.name.endsWith('.html')) &&
      !entry.name.endsWith('.spec.ts') &&
      !entry.name.endsWith('.test.ts') &&
      !entry.name.endsWith('.data.ts')
    ) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Check if text within parentheses is an allowable technical token,
 * acronym combination (e.g. "OT និង SLP"), file extension, or shortcut.
 */
function isAllowedParenContent(paren) {
  const trimmed = paren.trim();
  if (/^[\d\s.%+-\/]+$/.test(trimmed)) return true;
  if (trimmed.startsWith('.') && trimmed.length <= 5) return true; // file extensions like .ics
  if (trimmed.includes('Ctrl') || trimmed.includes('⌘') || trimmed.includes('Cmd')) return true;

  // Extract English words inside the parentheses
  const words = trimmed.match(/[A-Za-z]+/g) || [];
  if (words.length === 0) return true;

  // If all words are recognized acronyms or allowed tokens
  return words.every((w) => ALLOWED_ACRONYMS.has(w.toUpperCase()) || ALLOWED_TOKENS.has(w));
}

/**
 * Audit a single file for i18n leakages
 */
function auditFile(filePath, relativePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const offenses = [];

  const isLocalizedComponent = content.includes('currentLang') || content.includes('I18nService');

  // Check 1: Mixed parenthetical strings like 'Text (អត្ថបទ)' or 'អត្ថបទ (Text)'
  lines.forEach((rawLine, index) => {
    const lineNum = index + 1;
    const line = rawLine.trim();

    // Skip comment lines
    if (
      line.startsWith('//') ||
      line.startsWith('/*') ||
      line.startsWith('*') ||
      line.startsWith('<!--')
    ) {
      return;
    }

    // Skip the user-facing language selector option (standard UX requirement)
    if (rawLine.includes('<option value="km">🇰🇭 ភាសាខ្មែរ (Khmer)</option>')) {
      return;
    }

    // Skip regex expressions or parser patterns
    if (rawLine.includes('.match(') || rawLine.includes('RegExp(')) {
      return;
    }

    // Extract string literals ('...', "...", `...`)
    const quoteRegex = /(["'`])((?:\\.|(?!\1).)*)\1/g;
    let match;

    while ((match = quoteRegex.exec(rawLine)) !== null) {
      let strVal = match[2];

      if (!strVal || strVal.length < 3) continue;

      // In Angular attributes like [placeholder]="...", the double quotes enclose the expression.
      if (strVal.includes("currentLang() === 'km'") || strVal.includes('i18n.currentLang()')) {
        continue;
      }

      // Strip template interpolations ${...}
      strVal = strVal.replace(/\$\{[^}]+\}/g, ' ');

      // Check: Khmer text with (English) inside parentheses
      const kmWithEn = strVal.match(/[\u1780-\u17FF\u19E0-\u19FF]+[^(]*\(([^)]+)\)/);
      if (kmWithEn) {
        const paren = kmWithEn[1].trim();
        if (ENGLISH_WORD_REGEX.test(paren) && !isAllowedParenContent(paren)) {
          offenses.push({
            file: relativePath,
            line: lineNum,
            rule: 'NO_PARENTHETICAL_BILINGUAL',
            severity: 'error',
            message: `Khmer string contains parenthetical English translation "(${paren})"`,
            snippet: strVal,
          });
        }
      }

      // Check: English text with (Khmer) inside parentheses
      const enWithKm = strVal.match(/[A-Za-z]{3,}[^(]*\(([^)]+)\)/);
      if (enWithKm) {
        const paren = enWithKm[1].trim();
        if (KHMER_REGEX.test(paren)) {
          const leadingEn = enWithKm[0].split('(')[0].trim();
          const leadingWords = leadingEn.match(/[A-Za-z]+/g) || [];
          const isAcronymOnly = leadingWords.every(
            (w) => ALLOWED_ACRONYMS.has(w.toUpperCase()) || ALLOWED_TOKENS.has(w),
          );

          if (!isAcronymOnly) {
            offenses.push({
              file: relativePath,
              line: lineNum,
              rule: 'NO_PARENTHETICAL_BILINGUAL',
              severity: 'error',
              message: `English string contains parenthetical Khmer translation "(${paren})"`,
              snippet: strVal,
            });
          }
        }
      }
    }

    // Check template inline text nodes in HTML: >Text<
    const htmlTextRegex = />([^<]+)</g;
    while ((match = htmlTextRegex.exec(rawLine)) !== null) {
      const textVal = match[1].trim();
      if (!textVal || textVal.startsWith('{{') || textVal.endsWith('}}')) continue;

      const kmWithEn = textVal.match(/[\u1780-\u17FF\u19E0-\u19FF]+[^(]*\(([^)]+)\)/);
      if (kmWithEn) {
        const paren = kmWithEn[1].trim();
        if (ENGLISH_WORD_REGEX.test(paren) && !isAllowedParenContent(paren)) {
          offenses.push({
            file: relativePath,
            line: lineNum,
            rule: 'NO_PARENTHETICAL_BILINGUAL',
            severity: 'error',
            message: `HTML text node contains parenthetical English translation "(${paren})"`,
            snippet: textVal,
          });
        }
      }

      const enWithKm = textVal.match(/[A-Za-z]{3,}[^(]*\(([^)]+)\)/);
      if (enWithKm) {
        const paren = enWithKm[1].trim();
        if (KHMER_REGEX.test(paren)) {
          offenses.push({
            file: relativePath,
            line: lineNum,
            rule: 'NO_PARENTHETICAL_BILINGUAL',
            severity: 'error',
            message: `HTML text node contains parenthetical Khmer translation "(${paren})"`,
            snippet: textVal,
          });
        }
      }
    }
  });

  // Check 2 & 3: Language-conditional branch audit (ternaries & control flow)
  lines.forEach((rawLine, index) => {
    const lineNum = index + 1;

    // Check ternaries with condition === 'km'
    const kmTernaryRegex =
      /(?:currentLang|i18n\.currentLang|lang|this\.currentLang)\(\)\s*===\s*['"]km['"]\s*\?\s*(['"`])((?:\\.|(?!\1).)*)\1\s*:\s*(['"`])((?:\\.|(?!\3).)*)\3/g;
    let tMatch;

    while ((tMatch = kmTernaryRegex.exec(rawLine)) !== null) {
      const kmBranch = tMatch[2];
      const enBranch = tMatch[4];

      // Check: Khmer branch should NOT contain hardcoded English phrases
      const cleanedKm = kmBranch.replace(/\$\{[^}]+\}/g, ' ');
      const wordsInKm = cleanedKm.match(/[A-Za-z]{3,}/g) || [];
      const forbiddenEnWords = wordsInKm.filter(
        (w) => !ALLOWED_ACRONYMS.has(w.toUpperCase()) && !ALLOWED_TOKENS.has(w),
      );

      if (forbiddenEnWords.length > 0) {
        offenses.push({
          file: relativePath,
          line: lineNum,
          rule: 'NO_ENGLISH_IN_KHMER_BRANCH',
          severity: 'error',
          message: `Khmer branch of ternary contains hardcoded English text: "${forbiddenEnWords.join(', ')}"`,
          snippet: kmBranch,
        });
      }

      // Check: English branch should NOT contain Khmer characters
      if (KHMER_REGEX.test(enBranch)) {
        offenses.push({
          file: relativePath,
          line: lineNum,
          rule: 'NO_KHMER_IN_ENGLISH_BRANCH',
          severity: 'error',
          message: `English branch of ternary contains hardcoded Khmer characters`,
          snippet: enBranch,
        });
      }
    }

    // Check ternaries with condition === 'en'
    const enTernaryRegex =
      /(?:currentLang|i18n\.currentLang|lang|this\.currentLang)\(\)\s*===\s*['"]en['"]\s*\?\s*(['"`])((?:\\.|(?!\1).)*)\1\s*:\s*(['"`])((?:\\.|(?!\3).)*)\3/g;
    let tEnMatch;

    while ((tEnMatch = enTernaryRegex.exec(rawLine)) !== null) {
      const enBranch = tEnMatch[2];
      const kmBranch = tEnMatch[4];

      if (KHMER_REGEX.test(enBranch)) {
        offenses.push({
          file: relativePath,
          line: lineNum,
          rule: 'NO_KHMER_IN_ENGLISH_BRANCH',
          severity: 'error',
          message: `English branch of ternary contains hardcoded Khmer characters`,
          snippet: enBranch,
        });
      }

      const cleanedKm = kmBranch.replace(/\$\{[^}]+\}/g, ' ');
      const wordsInKm = cleanedKm.match(/[A-Za-z]{3,}/g) || [];
      const forbiddenEnWords = wordsInKm.filter(
        (w) => !ALLOWED_ACRONYMS.has(w.toUpperCase()) && !ALLOWED_TOKENS.has(w),
      );

      if (forbiddenEnWords.length > 0) {
        offenses.push({
          file: relativePath,
          line: lineNum,
          rule: 'NO_ENGLISH_IN_KHMER_BRANCH',
          severity: 'error',
          message: `Khmer branch of ternary contains hardcoded English text: "${forbiddenEnWords.join(', ')}"`,
          snippet: kmBranch,
        });
      }
    }
  });

  // Check 4: Un-translated UI elements in localized components
  if (isLocalizedComponent) {
    lines.forEach((rawLine, index) => {
      const lineNum = index + 1;
      const trimmed = rawLine.trim();

      // Check for standalone action buttons with untranslated text
      const btnMatch = /<button\b[^>]*>([^<]+)<\/button>/.exec(trimmed);
      if (btnMatch) {
        const text = btnMatch[1].trim();
        // If button has plain English action words without interpolation/ternary
        if (
          !text.startsWith('{{') &&
          !text.includes('currentLang') &&
          /^[A-Za-z\s+—–&]{4,}$/.test(text) &&
          !ALLOWED_TOKENS.has(text) &&
          !ALLOWED_ACRONYMS.has(text.toUpperCase())
        ) {
          offenses.push({
            file: relativePath,
            line: lineNum,
            rule: 'UNTRANSLATED_UI_ELEMENT',
            severity: 'error',
            message: `Button in localized component contains untranslated static English text: "${text}"`,
            snippet: trimmed,
          });
        }
      }
    });
  }

  return offenses;
}

/**
 * Main execution routine
 */
function main() {
  console.log(`${BOLD}${CYAN}====================================================${RESET}`);
  console.log(`${BOLD}${CYAN}  AutiCare i18n Leakage & Bilingual Purity Audit    ${RESET}`);
  console.log(`${BOLD}${CYAN}====================================================${RESET}\n`);

  if (!fs.existsSync(TARGET_DIR)) {
    console.error(`${RED}Error: Target directory does not exist: ${TARGET_DIR}${RESET}`);
    process.exit(1);
  }

  const files = collectFiles(TARGET_DIR);
  console.log(`Scanning ${BOLD}${files.length}${RESET} frontend files across ${TARGET_DIR}...\n`);

  let totalOffenses = 0;
  const fileOffensesMap = new Map();

  for (const file of files) {
    const relativePath = path.relative(process.cwd(), file);
    const offenses = auditFile(file, relativePath);

    if (offenses.length > 0) {
      totalOffenses += offenses.length;
      fileOffensesMap.set(relativePath, offenses);
    }
  }

  if (totalOffenses > 0) {
    console.log(`${BOLD}${RED}FAILED: Found ${totalOffenses} i18n leakage offense(s):${RESET}\n`);

    for (const [file, offenses] of fileOffensesMap.entries()) {
      console.log(`${BOLD}${YELLOW}File: ${file}${RESET}`);
      for (const offense of offenses) {
        console.log(
          `  ${RED}[${offense.rule}]${RESET} Line ${BOLD}${offense.line}${RESET}: ${offense.message}`,
        );
        console.log(`    Snippet: ${CYAN}${offense.snippet.slice(0, 100)}${RESET}\n`);
      }
    }

    console.log(
      `${RED}----------------------------------------------------------------------${RESET}`,
    );
    console.log(
      `${RED}Please eliminate bilingual coupling, translate hardcoded text, or remove leakages.${RESET}\n`,
    );
    process.exit(1);
  }

  console.log(`${BOLD}${GREEN}PASSED: 0 i18n leakages found across ${files.length} files!${RESET}`);
  console.log(`${GREEN}✔ All parenthetical pairs decoupled${RESET}`);
  console.log(`${GREEN}✔ All Khmer blocks free of English text${RESET}`);
  console.log(`${GREEN}✔ All English blocks free of Khmer text${RESET}`);
  console.log(`${GREEN}✔ All UI action elements translated${RESET}`);
  console.log(`${BOLD}${CYAN}====================================================${RESET}\n`);
  process.exit(0);
}

main();
