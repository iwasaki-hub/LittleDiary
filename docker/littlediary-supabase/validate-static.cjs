// Static validation only: never pulls images, starts containers, or connects to a database.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const yaml = require('js-yaml');
const dir = __dirname;
const source = fs.readFileSync(path.join(dir, 'compose.design.yml'), 'utf8');
const design = yaml.load(source);
const env = { ...process.env };
for (const key of Object.keys(env)) {
  if (/^(LD_|SUPABASE|EXPO_PUBLIC_SUPABASE|PG|DATABASE_URL|OPENAI_|AWS_|S3_)/.test(key)) delete env[key];
}
const variables = [...new Set([...source.matchAll(/\$\{(LD_[A-Z0-9_]+)/g)].map(match => match[1]))];
for (const key of variables) env[key] = 'STATIC_ONLY_NOT_A_SECRET';
env.LD_FUNCTIONS_MEMORY_LIMIT = '2g';
env.LD_POSTGRES_HOST = 'db';
env.LD_POSTGRES_PORT = '5432';
env.LD_POSTGRES_DB = 'postgres';
env.LD_SUPABASE_PUBLIC_URL = 'http://127.0.0.1:55321';
env.LD_API_EXTERNAL_URL = 'http://127.0.0.1:55321';
env.LD_SITE_URL = 'http://127.0.0.1:55321';
const resolved = JSON.parse(cp.execFileSync('docker', [
  'compose', '--env-file', '.env.example', '-f', 'compose.design.yml', 'config', '--format', 'json'
], { cwd: dir, env, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }));
assert.equal(resolved.name, 'littlediary-supabase-design');
const locked = require('./images.lock.json').images;
assert(locked.every(image => image.verified && image.digest.startsWith('sha256:')));
const expectedNames = ['studio', 'api-gw', 'auth', 'rest', 'realtime', 'storage', 'imgproxy', 'meta', 'functions', 'db', 'supavisor', 'mailpit'];
assert.deepEqual(Object.keys(resolved.services).sort(), expectedNames.sort());
const published = [];
let binds = 0;
for (const [name, service] of Object.entries(resolved.services)) {
  assert(locked.some(image => image.reference === service.image), name + ': unlocked image');
  assert.equal(service.pull_policy, 'never');
  for (const [dep, condition] of Object.entries(service.depends_on || {})) {
    assert(resolved.services[dep], name + ': dependency missing');
    if (condition.condition === 'service_healthy') assert(resolved.services[dep].healthcheck);
  }
  assert.deepEqual(Object.keys(service.networks), ['default']);
  assert(!service.network_mode && !service.privileged && !service.env_file);
  for (const port of service.ports || []) {
    assert.equal(port.host_ip, '127.0.0.1');
    assert.equal(port.protocol, 'tcp');
    published.push(`${name}:${port.published}->${port.target}`);
  }
  for (const mount of service.volumes || []) {
    if (mount.type === 'volume') assert(Object.hasOwn(resolved.volumes, mount.source));
    else {
      assert.equal(mount.type, 'bind');
      assert.equal(mount.read_only, true);
      assert.equal(mount.bind.create_host_path, false);
      const relative = path.relative(dir, mount.source);
      assert(!relative.startsWith('..') && !relative.includes('supabase-isolated'));
      if (relative.replaceAll('\\', '/') !== '.local/functions') assert(fs.existsSync(mount.source), relative + ': missing asset');
      binds++;
    }
  }
}
assert.deepEqual(published.sort(), ['api-gw:55321->8000', 'db:55322->5432', 'mailpit:55324->8025']);
assert.equal(resolved.networks.default.enable_ipv6, false);
assert(!resolved.networks.default.external);
assert.equal(resolved.networks.default.name, 'littlediary-supabase-design_default');
for (const volume of Object.values(resolved.volumes)) {
  assert(!volume.external);
  assert(volume.name.startsWith('littlediary-supabase-design_'));
}
const manifest = require('./upstream-manifest.json');
for (const file of manifest.files) {
  const bytes = fs.readFileSync(path.join(dir, file.local));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), file.sha256);
}
const serialized = JSON.stringify(resolved);
assert(!serialized.includes('supabase_db_littlediary-foundation-isolated'));
assert(!serialized.includes('littlediary-local-network'));
assert(!serialized.includes('foundation_test_entries'));
assert(!serialized.includes('kllghkmudpcwbnjsodtx'));
const example = fs.readFileSync(path.join(dir, '.env.example'), 'utf8');
for (const line of example.split(/\r?\n/).filter(line => line && !line.startsWith('#'))) {
  assert(/^LD_[A-Z0-9_]+=<[^>]+>$/.test(line));
}
assert.equal(Object.keys(design.services).length, 12);
console.log(`PASS: 12 services, 12 image digests, ${published.length} loopback ports, 5 isolated volumes, ${binds} bind references, ${manifest.files.length} source hashes`);
console.log('NOT VERIFIED: container startup, staged runtime files, generated secrets, DB initialization, health checks, Windows/LAN exposure.');
