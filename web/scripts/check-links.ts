import { PrismaClient } from '@prisma/client';
import https from 'https';
import http from 'http';

const prisma = new PrismaClient();

async function checkUrl(url: string): Promise<{ url: string; status: 'OK' | 'BROKEN' | 'REDIRECT'; code?: number; error?: string }> {
    return new Promise((resolve) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.request(url, { method: 'HEAD', timeout: 5000 }, (res) => {
            if (res.statusCode && ((res.statusCode >= 200 && res.statusCode < 400) || res.statusCode === 403 || res.statusCode === 465 || res.statusCode === 999)) {
                resolve({ url, status: 'OK', code: res.statusCode });
            } else if (res.statusCode && res.statusCode >= 400) {
                // Some servers explicitly deny HEAD requests with 404 or 403, retry with GET?
                // For now, mark as broken
                resolve({ url, status: 'BROKEN', code: res.statusCode });
            } else {
                resolve({ url, status: 'BROKEN', code: res.statusCode });
            }
        });

        req.on('error', (err) => {
            resolve({ url, status: 'BROKEN', error: err.message });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({ url, status: 'BROKEN', error: 'Timeout' });
        });

        req.end();
    });
}

async function main() {
    console.log('🔍 Checking links for all active resources...');
    const resources = await prisma.resource.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, title: true, link: true },
    });

    console.log(`Checking ${resources.length} resources...`);

    let passed = 0;
    let failed = 0;
    const brokenLinks: any[] = [];

    // Limit concurrency to avoid getting flagged
    const CONCURRENCY = 5;
    for (let i = 0; i < resources.length; i += CONCURRENCY) {
        const chunk = resources.slice(i, i + CONCURRENCY);
        const results = await Promise.all(chunk.map(async (r) => {
            if (!r.link) return { r, status: 'OK', url: '' };
            const check = await checkUrl(r.link);
            return { r, ...check };
        }));

        for (const res of results) {
            if (res.status === 'BROKEN') {
                // @ts-ignore
                console.log(`❌ BROKEN: ${res.r.title} - ${res.url} (${res.code || res.error})`);
                failed++;
                // @ts-ignore
                brokenLinks.push({ id: res.r.id, title: res.r.title, url: res.url, error: res.code || res.error });
            } else {
                passed++;
            }
        }
        process.stdout.write(`\rProgress: ${i + chunk.length}/${resources.length} checked.`);
    }

    console.log('\n\n--- SUMMARY ---');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);

    if (failed > 0) {
        console.log('\nBroken Resources:');
        brokenLinks.forEach(b => {
            console.log(`- [${b.id}] ${b.title}: ${b.url} (${b.error})`);
        });
        process.exit(1); // Fail the script
    } else {
        console.log('All links are working perfectly!');
        process.exit(0);
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
