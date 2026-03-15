const fs = require('fs');
const path = require('path');

const assets = [
    {
        src: "C:\\Users\\vikas\\.gemini\\antigravity\\brain\\af0e15e4-e02f-4c6b-aca2-f17e7e87cd19\\androjack_2d_vector_icon_1773552508695.png",
        dest: "c:\\Users\\vikas\\Downloads\\AndroJack-mcp-web\\androjack-icon.png"
    },
    {
        src: "C:\\Users\\vikas\\.gemini\\antigravity\\brain\\af0e15e4-e02f-4c6b-aca2-f17e7e87cd19\\androjack_hero_banner_16_9_1773552671587.png",
        dest: "c:\\Users\\vikas\\Downloads\\AndroJack-mcp-web\\og-image.png"
    }
];

assets.forEach(asset => {
    try {
        fs.copyFileSync(asset.src, asset.dest);
        console.log(`Successfully copied ${asset.src} to ${asset.dest}`);
    } catch (err) {
        console.error(`Error copying ${asset.src}: ${err.message}`);
    }
});
