// F-01 guard: AI flow modules are server-only. Outside src/ai and src/actions,
// only type imports from them are allowed, and no file other than src/actions/*
// may declare 'use server'.
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(__dirname, '../../src');

function listFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
        const full = path.join(dir, name);
        if (statSync(full).isDirectory()) return listFiles(full);
        return /\.(ts|tsx)$/.test(name) ? [full] : [];
    });
}

const files = listFiles(SRC).map((f) => ({ rel: path.relative(SRC, f), text: readFileSync(f, 'utf8') }));

describe('server-only AI flows', () => {
    it('are not value-imported outside src/ai and src/actions', () => {
        const offenders: string[] = [];
        for (const { rel, text } of files) {
            if (rel.startsWith('ai/') || rel.startsWith('actions/')) continue;
            for (const line of text.split('\n')) {
                const importsFlow = /from ['"]@\/ai\/flows\/|import\(['"]@\/ai\/flows\//.test(line);
                const typeOnly = /^\s*(import|export) type\b/.test(line);
                if (importsFlow && !typeOnly) offenders.push(`${rel}: ${line.trim()}`);
            }
        }
        expect(offenders).toEqual([]);
    });

    it("declare 'use server' only in src/actions", () => {
        const offenders = files
            .filter(({ text }) => /^\s*['"]use server['"];?\s*$/m.test(text))
            .map(({ rel }) => rel)
            .filter((rel) => !rel.startsWith('actions/'));
        expect(offenders).toEqual([]);
    });
});
