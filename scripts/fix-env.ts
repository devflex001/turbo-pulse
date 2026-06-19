import * as fs from "fs";

function fixEnv() {
  const content = fs.readFileSync(".env.local", "utf8");
  
  // Find the multiline JWT_PRIVATE_KEY enclosed in double quotes
  const startIdx = content.indexOf('JWT_PRIVATE_KEY="');
  if (startIdx === -1) return;
  
  const endIdx = content.indexOf('"\n', startIdx);
  if (endIdx === -1) return;
  
  const keySection = content.substring(startIdx + 'JWT_PRIVATE_KEY="'.length, endIdx);
  
  // Replace actual newlines with literal \n
  const singleLineKey = keySection.replace(/\r?\n/g, "\\n");
  
  const newContent = content.substring(0, startIdx) + 
                     `JWT_PRIVATE_KEY="${singleLineKey}"\n` + 
                     content.substring(endIdx + 2);
                     
  fs.writeFileSync(".env.local", newContent);
  console.log("Fixed .env.local");
}

fixEnv();
