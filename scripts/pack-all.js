const path = require('path');
const fs = require('fs-extra');
const { execSync } = require('child_process');
const archiver = require('archiver');

const pluginDir = path.resolve(__dirname, '../');
const pkgJsonPath = path.resolve(pluginDir, 'package.json');
// 从 scripts 目录向上 5 级到达仓库根目录（存放 build/tar 脚本的 package.json）
const rootDir = path.resolve(__dirname, '../../../../..');
const tarOutputDir = path.resolve(rootDir, 'storage/tar/@nocobase');

function runCmd(cmd, cwd, env = {}) {
  console.log(`[Executing] ${cmd}`);
  execSync(cmd, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, ...env }
  });
}

function verifyBuild(isFull = false) {
  const requiredFiles = [
    'server.js',
    'client.js',
    'client-v2.js',
    'dist/server/index.js',
    'dist/client/index.js',
    'dist/client-v2/index.js',
  ];
  for (const rel of requiredFiles) {
    const full = path.resolve(pluginDir, rel);
    if (!fs.existsSync(full)) {
      throw new Error(`[Verification Failed] Missing essential artifact: ${rel}`);
    }
  }
  if (isFull) {
    const offlineBundle = path.resolve(pluginDir, 'public/file-viewer/flyfish-file-viewer-web-full.iife.js');
    if (!fs.existsSync(offlineBundle)) {
      throw new Error('[Verification Failed] Full version is missing offline bundle: public/file-viewer/flyfish-file-viewer-web-full.iife.js');
    }
  }
  console.log(`[Verification] ${isFull ? 'Full' : 'Light'} version build artifacts verified successfully.`);
}

function createZip(outputPath, includePublic = false) {
  return new Promise((resolve, reject) => {
    fs.ensureDirSync(path.dirname(outputPath));
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      const sizeMb = (archive.pointer() / 1024 / 1024).toFixed(2);
      const sizeKb = (archive.pointer() / 1024).toFixed(1);
      const displaySize = archive.pointer() > 1024 * 1024 ? `${sizeMb} MB` : `${sizeKb} KB`;
      console.log(`[Zip Success] ${path.basename(outputPath)} (${displaySize})`);
      resolve();
    });
    archive.on('error', (err) => reject(err));

    archive.pipe(output);

    const baseFiles = [
      'package.json',
      'README.md',
      'README_EN.md',
      'LICENSE',
      'server.js',
      'server.d.ts',
      'client.js',
      'client.d.ts',
      'client-v2.js',
      'client-v2.d.ts'
    ];

    for (const f of baseFiles) {
      const p = path.resolve(pluginDir, f);
      if (fs.existsSync(p)) {
        archive.file(p, { name: f });
      }
    }

    archive.directory(path.resolve(pluginDir, 'dist'), 'dist');

    if (includePublic && fs.existsSync(path.resolve(pluginDir, 'public'))) {
      archive.directory(path.resolve(pluginDir, 'public'), 'public');
    }

    archive.finalize();
  });
}

async function main() {
  console.log('=== START PACKING DUAL VERSIONS ===');
  
  // 1. 读取原 package.json
  const pkgContent = await fs.readFile(pkgJsonPath, 'utf8');
  const pkg = JSON.parse(pkgContent);
  const originalVersion = pkg.version;
  
  try {
    // ----------------------------------------------------
    // Step 1: Pack Light Version (默认不包含内置静态资源)
    // ----------------------------------------------------
    console.log('\n--- Step 1: Packing Light Version ---');
    // 确保清理了可能存在的本地资源
    const targetDir = path.resolve(pluginDir, './public/file-viewer');
    if (await fs.pathExists(targetDir)) {
      console.log('Cleaning up existing public/file-viewer directory...');
      await fs.remove(targetDir);
    }
    
    // 运行构建和打包
    runCmd('yarn build @nocobase/plugin-file-previewer-kkfileview', rootDir, { BUILD_FULL: 'false' });
    verifyBuild(false);
    runCmd('yarn tar @nocobase/plugin-file-previewer-kkfileview', rootDir);
    
    const lightZipPath = path.resolve(tarOutputDir, `plugin-file-previewer-kkfileview-${originalVersion}.zip`);
    await createZip(lightZipPath, false);
    console.log('[Success] Light Version packed successfully.');

    // ----------------------------------------------------
    // Step 2: Pack Full Version (包含内置静态资源)
    // ----------------------------------------------------
    console.log('\n--- Step 2: Packing Full Version ---');
    // 修改 package.json 的版本号，添加 -full 后缀
    pkg.version = `${originalVersion}-full`;
    await fs.writeJson(pkgJsonPath, pkg, { spaces: 2 });
    console.log(`Temporarily updated version to ${pkg.version}`);

    // 设置 BUILD_FULL 为 true 运行构建和打包
    runCmd('yarn build @nocobase/plugin-file-previewer-kkfileview', rootDir, { BUILD_FULL: 'true' });
    verifyBuild(true);
    runCmd('yarn tar @nocobase/plugin-file-previewer-kkfileview', rootDir);
    
    const fullZipPath = path.resolve(tarOutputDir, `plugin-file-previewer-kkfileview-${originalVersion}-full.zip`);
    await createZip(fullZipPath, true);
    console.log('[Success] Full Version packed successfully.');

  } catch (error) {
    console.error('[Error] Packing failed:', error);
    process.exitCode = 1;
  } finally {
    // ----------------------------------------------------
    // Cleanup: 还原 package.json 和清理临时静态资源
    // ----------------------------------------------------
    console.log('\n--- Cleaning Up & Restoring ---');
    // 还原 package.json
    await fs.writeFile(pkgJsonPath, pkgContent, 'utf8');
    console.log('Restored package.json to original state.');

    // 清理生成的 public/file-viewer（恢复轻量状态）
    const targetDir = path.resolve(pluginDir, './public/file-viewer');
    if (await fs.pathExists(targetDir)) {
      console.log('Cleaning up temporary public/file-viewer directory...');
      await fs.remove(targetDir);
    }
    console.log('Cleanup completed.');
  }
  
  console.log('\n=== DUAL PACKING COMPLETED ===');
  console.log(`Light Version (tgz): storage/tar/@nocobase/plugin-file-previewer-kkfileview-${originalVersion}.tgz`);
  console.log(`Light Version (zip): storage/tar/@nocobase/plugin-file-previewer-kkfileview-${originalVersion}.zip`);
  console.log(`Full Version  (tgz): storage/tar/@nocobase/plugin-file-previewer-kkfileview-${originalVersion}-full.tgz`);
  console.log(`Full Version  (zip): storage/tar/@nocobase/plugin-file-previewer-kkfileview-${originalVersion}-full.zip`);
}

main().catch(console.error);
