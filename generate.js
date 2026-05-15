const fs = require("fs");
const path = require("path");

const SHEET_URL =
    "https://script.google.com/macros/s/AKfycbxNiT8rPF5KsL13CZjhD2I85IrUiVoXQtKBjui_UQUk64o3OH-4GeZo0_CYryMsVPb8rA/exec";

const SITE_URL = "https://x-card-project.vercel.app";

function makeSafeId(value) {
    return String(value)
        .replace(/\.[^/.]+$/, "")
        .replace(/[()]/g, "")
        .replace(/\s+/g, "_")
        .replace(/__+/g, "_")
        .trim();
}

function getExt(filename) {
    const ext = path.extname(String(filename)).toLowerCase();
    return ext || ".png";
}

async function downloadImage(url, savePath) {
    if (!url) return false;

    const response = await fetch(url);

    if (!response.ok) {
        console.log(`画像取得失敗: ${url}`);
        return false;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(savePath, buffer);
    return true;
}

async function main() {
    fs.mkdirSync("cards", { recursive: true });
    fs.mkdirSync("images", { recursive: true });

    const response = await fetch(SHEET_URL);
    const items = await response.json();

    for (const item of items) {
        if (!item.id) continue;

        const safeId = makeSafeId(item.id);
        const ext = getExt(item.image);
        const imageFileName = `${safeId}${ext}`;
        const localImagePath = `images/${imageFileName}`;
        const publicImageUrl = `${SITE_URL}/images/${imageFileName}`;

        await downloadImage(item.image_preview, localImagePath);

        const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">

<title>${item.title}</title>

<meta name="twitter:card" content="summary_large_image">
<meta property="og:title" content="${item.title}">
<meta property="og:description" content="${item.description}">
<meta property="og:image" content="${publicImageUrl}">

<meta http-equiv="refresh" content="0; url=${item.target_URL}">
</head>

<body>
<h1>${item.title}</h1>
</body>
</html>
`;

        fs.writeFileSync(`cards/${safeId}.html`, html);

        console.log(`${safeId}.html 作成`);
        console.log(`${imageFileName} 作成`);
    }
}

main();