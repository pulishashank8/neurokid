
const { z } = require('zod');

const url = "postgresql://postgres:Chowdary@12345@db.xwkcdygpvvbbyabfgumx.supabase.co:5432/postgres";
const schema = z.string().url();

try {
    schema.parse(url);
    console.log("Validation PASSED");
} catch (e) {
    console.log("Validation FAILED");
    console.log(e.message);
}
