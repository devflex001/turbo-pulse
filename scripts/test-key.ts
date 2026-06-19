import * as fs from "fs";
import { importPKCS8 } from "jose";
 
async function test() {
  try {
    const envContent = fs.readFileSync(".env.local", "utf8");
    const match = envContent.match(/JWT_PRIVATE_KEY=(.*)/);
    let raw = match ? match[1] : "";
    
    // If it spans multiple lines because of quotes
    if (raw.startsWith('"')) {
       const startIdx = envContent.indexOf('JWT_PRIVATE_KEY="') + 'JWT_PRIVATE_KEY="'.length;
       const endIdx = envContent.indexOf('"\n', startIdx);
       raw = envContent.substring(startIdx, endIdx);
    }
    
    console.log("Extracted length:", raw.length);
    console.log("Includes actual newline?", raw.includes("\n"));
    console.log("Includes literal \\n?", raw.includes("\\n"));

    const formatted = raw.replace(/\\n/g, "\n");
    console.log("Formatted first 50 chars:", formatted.substring(0, 50));

    const key = await importPKCS8(formatted, "RS256");
    console.log("Success! Key imported:", !!key);
  } catch (err) {
    console.error("Failed:", err);
  }
}

test();
