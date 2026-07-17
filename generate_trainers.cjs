const fs = require('fs');
const mammoth = require('mammoth');

const staffJsonPath = 'hrdc_staff.json';
const docxPath = 'C:\\Users\\arifz\\Downloads\\TRAINER PROFILE- FTKE- draft-3 April 2026-KA.docx';

async function generateJSON() {
    // 1. Parse exported staff status JSON for Certified/Accredited status.
    const excelEntries = JSON.parse(fs.readFileSync(staffJsonPath, 'utf8'));
    
    const statusMap = {};
    excelEntries.forEach(entry => {
        const rawName = entry.atech || '';
        const name = rawName.trim().toLowerCase();
        if (name && name !== 'name') {
            statusMap[name] = {
                isCertified: entry['__EMPTY'] === '✔',
                isAccredited: entry['__EMPTY_1'] === '✔'
            };
        }
    });

    // 2. Parse Word for Profile Details
    const result = await mammoth.convertToHtml({ path: docxPath });
    const html = result.value;
    
    const sections = html.split('<h2>');
    const trainers = [];
    
    // Modern cinematic banners (more variations)
    const banners = [
        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "linear-gradient(135deg, #2af598 0%, #009efd 100%)",
        "linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)",
        "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
        "linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)",
        "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        "linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)",
        "linear-gradient(135deg, #c3cfe2 0%, #c3cfe2 100%)",
        "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
        "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)"
    ];

    sections.forEach((section, index) => {
        if (!section.includes('</h2>')) return;

        const namePart = section.split('</h2>')[0];
        const contentPart = section.split('</h2>')[1];
        
        const name = namePart.replace(/<[^>]+>/g, '').trim();
        
        const imgMatch = contentPart.match(/<img[^>]+src="([^">]+)"/);
        const photo = imgMatch ? imgMatch[1] : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;

        const pMatches = contentPart.match(/<p>(.*?)<\/p>/g) || [];
        let description = "";
        let title = "Expert Trainer";

        // Filter paragraphs to find the actual long bio
        const longParagraphs = pMatches
            .map(p => p.replace(/<[^>]+>/g, '').trim())
            .filter(text => text.length > 100 && !text.includes('Email:') && !text.includes('e-CV:'));

        if (longParagraphs.length > 0) {
            description = longParagraphs[0]; // Use the first substantial paragraph
            
            // Re-scan that paragraph for the title manually if needed
            const bioHtml = pMatches.find(p => p.includes(longParagraphs[0])) || "";
            const titleMatch = bioHtml.match(/<strong>(.*?)<\/strong>/);
            if (titleMatch && titleMatch[1].length < 80) {
                title = titleMatch[1];
            }
        } else {
            // Fallback description
            description = "Expert specialized in advanced engineering and technical industrial applications at Universiti Teknikal Malaysia Melaka (UTeM).";
        }

        const lowerName = name.toLowerCase();
        let status = { isCertified: false, isAccredited: false };
        const clean = (s) => s.replace(/[^a-z0-9]/g, '');
        const target = clean(lowerName);
        const matchKey = Object.keys(statusMap).find(k => clean(k).includes(target) || target.includes(clean(k)));
        if (matchKey) status = statusMap[matchKey];

        trainers.push({
            id: trainers.length + 1,
            name: name,
            title: title,
            description: description,
            photo: photo,
            banner: banners[trainers.length % banners.length],
            isCertified: status.isCertified,
            isAccredited: status.isAccredited
        });
    });

    fs.writeFileSync('src/trainers_data.json', JSON.stringify(trainers, null, 4));
    console.log(`Successfully generated data for ${trainers.length} trainers in src/trainers_data.json.`);
}

generateJSON().catch(err => console.error(err));
