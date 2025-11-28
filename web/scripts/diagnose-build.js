const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const TSCONFIG_PATH = path.join(ROOT_DIR, 'tsconfig.json');

// Configuration
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.scss'];
const IGNORE_DIRS = ['node_modules', '.next', '.git', '.vercel', 'dist', 'build', 'coverage'];

// Load tsconfig for paths
let tsConfigPaths = {};
try {
    const tsConfig = JSON.parse(fs.readFileSync(TSCONFIG_PATH, 'utf8'));
    if (tsConfig.compilerOptions && tsConfig.compilerOptions.paths) {
        tsConfigPaths = tsConfig.compilerOptions.paths;
    }
} catch (e) {
    console.warn('Could not load tsconfig.json:', e.message);
}

function resolveAlias(importPath) {
    for (const alias in tsConfigPaths) {
        const aliasPrefix = alias.replace('/*', '');
        if (importPath.startsWith(aliasPrefix)) {
            const paths = tsConfigPaths[alias];
            if (paths && paths.length > 0) {
                // Assuming the first path is the primary one and it's relative to baseUrl (which is '.')
                const target = paths[0].replace('/*', '');
                return path.join(ROOT_DIR, importPath.replace(aliasPrefix, target));
            }
        }
    }
    return null;
}

function getActualPath(dir, filename) {
    try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            if (file.toLowerCase() === filename.toLowerCase()) {
                return file;
            }
        }
    } catch (e) {
        return null;
    }
    return null;
}
function checkPathCase(fullPath) {
    const relativePath = path.relative(ROOT_DIR, fullPath);
    const segments = relativePath.split(path.sep);
    let currentPath = ROOT_DIR;

    for (const segment of segments) {
        if (segment === '.' || segment === '..') continue;

        const actualSegment = getActualPath(currentPath, segment);
        if (actualSegment && actualSegment !== segment) {
            return {
                valid: false,
                segment: segment,
                actual: actualSegment,
                path: currentPath
            };
        }
        currentPath = path.join(currentPath, segment);
    }
    return { valid: true };
}

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const errors = [];
    const isClientComponent = content.includes('"use client"') || content.includes("'use client'");

    // Regex for imports and exports
    const importRegex = /from\s+['"]([^'"]+)['"]/g;
    const dynamicImportRegex = /import\(['"]([^'"]+)['"]\)/g;
    const exportRegex = /export\s+.*\s+from\s+['"]([^'"]+)['"]/g;

    let match;
    const imports = [];
    while ((match = importRegex.exec(content)) !== null) {
        imports.push({ path: match[1], index: match.index, line: content.substring(0, match.index).split('\n').length });
    }
    while ((match = dynamicImportRegex.exec(content)) !== null) {
        imports.push({ path: match[1], index: match.index, line: content.substring(0, match.index).split('\n').length });
    }
    while ((match = exportRegex.exec(content)) !== null) {
        imports.push({ path: match[1], index: match.index, line: content.substring(0, match.index).split('\n').length });
    }

    if (isClientComponent) {
        for (const imp of imports) {
            if (imp.path === 'next/headers' || imp.path === 'next/cookies') {
                errors.push(`[Client Component Violation] Line ${imp.line}: Client component imports server-only module '${imp.path}'`);
            }
        }
    }

    for (const imp of imports) {
        const importPath = imp.path;

        // Skip external packages
        if (!importPath.startsWith('.') && !importPath.startsWith('@/')) {
            continue;
        }

        let absolutePath = null;

        if (importPath.startsWith('@/')) {
            absolutePath = resolveAlias(importPath);
        } else {
            absolutePath = path.resolve(path.dirname(filePath), importPath);
        }

        if (!absolutePath) {
            continue;
        }

        // Check existence and case sensitivity
        let exists = false;

        // Try extensions
        const extensionsToTry = ['', ...EXTENSIONS, ...EXTENSIONS.map(e => `/index${e}`)];

        for (const ext of extensionsToTry) {
            const testPath = absolutePath + ext;
            if (fs.existsSync(testPath)) {
                // Check full path casing
                const caseCheck = checkPathCase(testPath);
                if (!caseCheck.valid) {
                    errors.push(`[Case Sensitivity] Line ${imp.line}: Import '${importPath}' resolves to segment '${caseCheck.segment}' but file system has '${caseCheck.actual}' in '${path.relative(ROOT_DIR, caseCheck.path)}'`);
                }

                exists = true;
                break;
            }
        }

        if (!exists) {
            errors.push(`[Missing File] Line ${imp.line}: Import '${importPath}' not found.`);
        }
    }

    return errors;
}

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        if (IGNORE_DIRS.includes(file)) return;
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else {
            if (EXTENSIONS.includes(path.extname(file))) {
                results.push(file);
            }
        }
    });
    return results;
}

console.log('Starting build diagnosis...');
const allFiles = walkDir(ROOT_DIR);
console.log(`Found ${allFiles.length} files to check.`);
let totalErrors = 0;

allFiles.forEach(file => {
    const errors = checkFile(file);
    if (errors.length > 0) {
        console.log(`\nFile: ${path.relative(ROOT_DIR, file)}`);
        errors.forEach(e => console.log(`  - ${e}`));
        totalErrors += errors.length;
    }
});

console.log(`\nDiagnosis complete. Found ${totalErrors} potential issues.`);
