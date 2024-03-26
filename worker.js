onmessage = function(event) {
    const { imageUrl, tileWidth, tileHeight } = event.data;
    
    fetch(imageUrl)
      .then(response => response.blob())
      .then(blob => createImageBitmap(blob))
      .then(image => {
        const result = computeTileMap(image, tileWidth, tileHeight);
        postMessage(result);
      })
      .catch(error => {
        console.error('Fehler beim Laden des Bildes:', error);
    });
};

function computeTileMap(loadedImage, tileWidth, tileHeight) {
    let unique_tiles = [];
    let tile_hashes = [];

    const canvas = new OffscreenCanvas(loadedImage.width, loadedImage.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(loadedImage, 0, 0);
    const imageData = ctx.getImageData(0, 0, loadedImage.width, loadedImage.height);
    const pixels = new Uint8ClampedArray(imageData.data.buffer);

    const rows = Math.floor(loadedImage.width / tileWidth);
    const cols = Math.floor(loadedImage.height / tileHeight);

    for (let y = 0; y < cols; y++) {
        for (let x = 0; x < rows; x++) {
            const tileData = getTileData(pixels, loadedImage.width, x * tileWidth, y * tileHeight, tileWidth, tileHeight);

            let isUnique = true;
            for (let i = 0; i < unique_tiles.length; i++) {
                if (compareTiles(unique_tiles[i], tileData)) {
                    isUnique = false;
                    break;
                }
            }

            if (isUnique) {
                unique_tiles.push(tileData);
            }
        }
    }

    return unique_tiles;
}

function getTileData(pixels, width, startX, startY, tileWidth, tileHeight) {
    const tileData = new Uint8ClampedArray(tileWidth * tileHeight * 4);

    for (let y = 0; y < tileHeight; y++) {
        for (let x = 0; x < tileWidth; x++) {
            const sourceIndex = ((startY + y) * width + startX + x) * 4;
            const destIndex = (y * tileWidth + x) * 4;
            for (let i = 0; i < 4; i++) {
                tileData[destIndex + i] = pixels[sourceIndex + i];
            }
        }
    }

    return tileData;
}

function compareTiles(tileData1, tileData2) {
    if (tileData1.length !== tileData2.length) {
        return false;
    }
    for (let i = 0; i < tileData1.length; i++) {
        if (tileData1[i] !== tileData2[i]) {
            return false;
        }
    }
    return true;
}
