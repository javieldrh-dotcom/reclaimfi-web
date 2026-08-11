#!/usr/bin/env node
// Verifica archivos en staging antes de cada commit:
// 1. Corrupcion de codificacion (mojibake UTF-8 mal interpretado)
// 2. maxWidth sin margin de centrado en el mismo bloque de estilo
const { execSync } = require("child_process");
const fs = require("fs");

function getStagedFiles() {
  const output = execSync("git diff --cached --name-only --diff-filter=ACM", { encoding: "utf-8" });
  return output
    .split("\n")
    .map((f) => f.trim())
    .filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"));
}

const MOJIBAKE_PATTERN = /Ã[\x80-\xBF]|Ã¢|Ãƒ/;

function checkEncoding(content, filePath, issues) {
  if (MOJIBAKE_PATTERN.test(content)) {
    issues.push(filePath + ": posible corrupcion de codificacion (texto tipo 'Ã...' detectado). Verifica caracteres especiales/acentos.");
  }
}

function checkMaxWidthCentering(content, filePath, issues) {
  const styleBlocks = content.match(/style=\{\{[^}]*maxWidth:\s*\d+[^}]*\}\}/g) || [];
  styleBlocks.forEach((block) => {
    if (!/margin/.test(block)) {
      const snippet = block.length > 80 ? block.slice(0, 80) + "..." : block;
      issues.push(filePath + ": bloque con maxWidth sin margin de centrado -> " + snippet);
    }
  });
}

function main() {
  const files = getStagedFiles();
  const issues = [];

  files.forEach((filePath) => {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, "utf-8");
    checkEncoding(content, filePath, issues);
    checkMaxWidthCentering(content, filePath, issues);
  });

  if (issues.length > 0) {
    console.log("\n--- Verificacion pre-commit encontro posibles problemas ---\n");
    issues.forEach((issue) => console.log("  - " + issue));
    console.log("\nRevisa lo anterior. Si es un falso positivo intencional, usa 'git commit --no-verify' para omitir esta vez.\n");
    process.exit(1);
  }

  console.log("Verificacion pre-commit: sin problemas detectados.");
  process.exit(0);
}

main();