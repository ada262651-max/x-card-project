const fs = require("fs");

const SHEET_URL =
    "https://script.google.com/macros/s/AKfycbxNiT8rPF5KsL13CZjhD2I85IrUiVoXQtKBjui_UQUk64o3OH-4GeZo0_CYryMsVPb8rA/exec";

function makeSafeId(value) {
    return String(value)
        .replace(/\.[^/.]+$/, "")
        .replace(/[()]/g, "_")
        .replace(/\s+/g, "_")
        .replace(/__+/g, "_")
        .replace(/^_+|_+$/g, "");
}

async function main() {
    const response = await fetch(SHEET_URL);
    const items = await response.json();

    for (const item of items) {
        const safeId = makeSafeId(item.id);

        const imageUrl = item.image;

        const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">

<title>${item.title}</title>

<meta name="twitter:card" content="summary_large_image">
<meta property="og:title" content="${item.title}">
<meta property="og:description" content="${item.description}">
<meta property="og:image" content="${imageUrl}">

<meta http-equiv="refresh" content="0; url=${item.target_URL}">
</head>

<body>
<h1>${item.title}</h1>
</body>
</html>
`;

        fs.writeFileSync(
            `cards/${safeId}.html`,
            html
        );

        console.log(`${safeId}.html 作成`);
    }
}

main();