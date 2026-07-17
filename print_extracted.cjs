const fs = require('fs');

if (fs.existsSync("extracted_upload_script.txt")) {
    let content = fs.readFileSync("extracted_upload_script.txt", 'utf8');
    // If it starts and ends with double quotes, it might be a raw JSON string
    if (content.startsWith('"') && content.endsWith('"')) {
        try {
            content = JSON.parse(content);
        } catch(e) {}
    }
    
    // Replace literal "\\n" with "\n" if any
    content = content.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
    
    const lines = content.split('\n');
    console.log(`Total lines: ${lines.length}`);
    for (let i = 0; i < Math.min(lines.length, 250); i++) {
        console.log(`${i+1}: ${lines[i]}`);
    }
} else {
    console.log("File not found");
}
