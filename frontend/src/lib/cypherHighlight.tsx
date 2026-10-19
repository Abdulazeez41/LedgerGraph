import React from 'react';

interface CypherHighlightProps {
  code: string;
  className?: string;
}

type TokenType =
  | 'keyword'
  | 'function'
  | 'label'
  | 'relation'
  | 'param'
  | 'string'
  | 'number'
  | 'punctuation'
  | 'comment'
  | 'text';

interface Token {
  type: TokenType;
  text: string;
}

const KEYWORDS = new Set([
  'MATCH',
  'OPTIONAL',
  'WHERE',
  'RETURN',
  'WITH',
  'ORDER',
  'BY',
  'DESC',
  'ASC',
  'LIMIT',
  'SKIP',
  'CREATE',
  'MERGE',
  'SET',
  'DELETE',
  'DETACH',
  'AS',
  'DISTINCT',
  'AND',
  'OR',
  'NOT',
  'IN',
  'IS',
  'NULL',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END',
  'UNWIND',
  'UNION',
  'ALL',
]);

const FUNCTIONS = new Set([
  'count',
  'sum',
  'avg',
  'min',
  'max',
  'coalesce',
  'collect',
  'size',
  'exists',
  'tolower',
  'toupper',
  'round',
  'abs',
  'datetime',
  'duration',
]);

export function tokenizeCypher(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = code.length;

  while (i < n) {
    // Comments //
    if (code[i] === '/' && code[i + 1] === '/') {
      let j = i + 2;
      while (j < n && code[j] !== '\n') j++;
      tokens.push({ type: 'comment', text: code.slice(i, j) });
      i = j;
      continue;
    }

    // Strings '...' or "..."
    if (code[i] === "'" || code[i] === '"') {
      const quote = code[i];
      let j = i + 1;
      while (j < n && code[j] !== quote) {
        if (code[j] === '\\') j += 2;
        else j++;
      }
      if (j < n) j++; // closing quote
      tokens.push({ type: 'string', text: code.slice(i, j) });
      i = j;
      continue;
    }

    // Parameters $param
    if (code[i] === '$') {
      let j = i + 1;
      while (j < n && /[a-zA-Z0-9_]/.test(code[j])) j++;
      tokens.push({ type: 'param', text: code.slice(i, j) });
      i = j;
      continue;
    }

    // Labels or relationship types :Label
    if (code[i] === ':' && /[a-zA-Z_]/.test(code[i + 1] || '')) {
      let j = i + 1;
      while (j < n && /[a-zA-Z0-9_]/.test(code[j])) j++;
      tokens.push({ type: 'label', text: code.slice(i, j) });
      i = j;
      continue;
    }

    // Relationship arrow symbols -> <- -[]-
    if (code.slice(i, i + 2) === '->' || code.slice(i, i + 2) === '<-') {
      tokens.push({ type: 'relation', text: code.slice(i, i + 2) });
      i += 2;
      continue;
    }

    // Numbers
    if (/\d/.test(code[i])) {
      let j = i;
      while (j < n && /[\d.]/.test(code[j])) j++;
      tokens.push({ type: 'number', text: code.slice(i, j) });
      i = j;
      continue;
    }

    // Identifiers or keywords
    if (/[a-zA-Z_]/.test(code[i])) {
      let j = i;
      while (j < n && /[a-zA-Z0-9_]/.test(code[j])) j++;
      const word = code.slice(i, j);
      const upper = word.toUpperCase();
      const lower = word.toLowerCase();

      if (KEYWORDS.has(upper)) {
        tokens.push({ type: 'keyword', text: word });
      } else if (FUNCTIONS.has(lower)) {
        tokens.push({ type: 'function', text: word });
      } else {
        tokens.push({ type: 'text', text: word });
      }
      i = j;
      continue;
    }

    // Punctuation / brackets
    if (/[(){}\[\],;.*=<>!+\-]/.test(code[i])) {
      tokens.push({ type: 'punctuation', text: code[i] });
      i++;
      continue;
    }

    // Whitespace / other
    tokens.push({ type: 'text', text: code[i] });
    i++;
  }

  return tokens;
}

const TOKEN_STYLES: Record<TokenType, string> = {
  keyword: 'text-brass font-semibold',
  function: 'text-dollar-green-light',
  label: 'text-chalk font-medium bg-white/5 px-0.5 rounded',
  relation: 'text-brass-light font-bold',
  param: 'text-vermilion-light font-mono',
  string: 'text-[#9BB49B]',
  number: 'text-[#D4AF37]',
  punctuation: 'text-muted',
  comment: 'text-muted-dim italic',
  text: 'text-chalk/90',
};

export const CypherHighlight: React.FC<CypherHighlightProps> = ({ code, className = '' }) => {
  const tokens = React.useMemo(() => tokenizeCypher(code), [code]);

  return (
    <pre className={`font-mono text-xs leading-relaxed whitespace-pre-wrap select-text ${className}`}>
      <code>
        {tokens.map((token, idx) => (
          <span key={idx} className={TOKEN_STYLES[token.type] || ''}>
            {token.text}
          </span>
        ))}
      </code>
    </pre>
  );
};
