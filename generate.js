const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const SHEET_URL =
    "https://script.google.com/macros/s/AKfycbxNiT8rPF5KsL13CZjhD2I85IrUiVoXQtKBjui_UQUk64o3OH-4GeZo0_CYryMsVPb8rA/exec";

const SITE_URL =
    "https://x-card-project.vercel.app";

function makeSafeId(value) {
    return String(value)
        .replace(/\.[^/.]+$/, "")
        .replace(/[()]/g, "_")
        .replace(/\s+/g, "_")
        .replace(/__+/g, "_")
        .replace(/^_+|_+$/g, "");
}

async function downloadImage(url) {
    const response = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0"
        }
    });

    if (!response.ok) {
        throw new Error(`画像取得失敗: ${url}`);
    }

    return Buffer.from(await response.arrayBuffer());
}

async function main() {
    fs.mkdirSync("cards", { recursive: true });
    fs.mkdirSync("images", { recursive: true });

    const response = await fetch(SHEET_URL);
    const items = await response.json();

    for (const item of items) {
        if (!item.id) continue;

        const safeId = makeSafeId(item.id);
        const blurValue = Number(item.blur) || 6;
        const updateVersion = Number(item.update) || 1;

        const imageFileName =
            `${safeId}_b${blurValue}_u${updateVersion}.jpg`;

        const cardFileName =
            `${safeId}_u${updateVersion}.html`;

        const localImagePath =
            path.join("images", imageFileName);

        const publicImageUrl =
            `${SITE_URL}/images/${imageFileName}`;

        const cardUrl =
            `${SITE_URL}/cards/${cardFileName}`;

        try {
            const imageBuffer = await downloadImage(item.image);

            await sharp(imageBuffer)
                .resize(1200, 630, {
                    fit: "cover",
                    position: "center"
                })
                .blur(blurValue)
                .jpeg({
                    quality: 88
                })
                .toFile(localImagePath);

            console.log(`${imageFileName} 作成 blur=${blurValue}`);
        } catch (error) {
            console.log(`${safeId}: ${error.message}`);
            continue;
        }

        const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">

<title>${item.title}</title>

<meta name="twitter:card" content="summary_large_image">
<meta property="og:type" content="website">
<meta property="og:title" content="${item.title}">
<meta property="og:description" content="${item.description}">
<meta property="og:image" content="${publicImageUrl}">
<meta property="og:image:secure_url" content="${publicImageUrl}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${cardUrl}">

<meta http-equiv="refresh" content="0; url=${item.target_URL}">
</head>

<body>
<h1>${item.title}</h1>
<p>${item.description}</p>
</body>
</html>
`;

        fs.writeFileSync(`cards/${cardFileName}`, html);
        console.log(`${cardFileName} 作成`);
    }
}

main();