const outputImageContainer = document.getElementById("output-canvas");
const startBtn = document.getElementById("start-btn");

const tileWidth = 16;
const tileHeight = 16;

const outputSize = 10;

const generationDelay = -1;

const image = new Image();
image.src = './imgs/tiles.png';

const TILE_TYPES = {
  land: 0,
  coast: 1,
  sea: 2
};


class Tile {
  constructor(entropy, x, y) {
    this.entropy = entropy;
    this.x = x;
    this.y = y;

    this.collapsed = false;
  
    this.north = null;
    this.east = null;
    this.south = null;
    this.west = null;
  }
};

class Rule {
  constructor(type, weight = 1, textureX, textureY, north, east, south, west) {
    this.type = type;

    this.weight = weight;

    this.textureX = textureX;
    this.textureY = textureY;
  
    this.north = north;
    this.east = east;
    this.south = south;
    this.west = west;
  }
}


// Die Kacheln definieren
const rules = [
  new Rule(TILE_TYPES.land, 1, 0, 0, 
    [TILE_TYPES.land, TILE_TYPES.coast],
    [TILE_TYPES.land, TILE_TYPES.coast], 
    [TILE_TYPES.land, TILE_TYPES.coast], 
    [TILE_TYPES.land, TILE_TYPES.coast]),
  new Rule(TILE_TYPES.coast, 1, 16, 0, 
    [TILE_TYPES.coast, TILE_TYPES.land, TILE_TYPES.sea], 
    [TILE_TYPES.coast, TILE_TYPES.land, TILE_TYPES.sea], 
    [TILE_TYPES.coast, TILE_TYPES.land, TILE_TYPES.sea], 
    [TILE_TYPES.coast, TILE_TYPES.land, TILE_TYPES.sea]),
  new Rule (TILE_TYPES.sea, 1, 32, 0, 
    [TILE_TYPES.sea, TILE_TYPES.coast], 
    [TILE_TYPES.sea, TILE_TYPES.coast], 
    [TILE_TYPES.sea, TILE_TYPES.coast], 
    [TILE_TYPES.sea, TILE_TYPES.coast])
];


let timeoutId = null;

// Event-Listener für den Start-Button
startBtn.addEventListener('click', startGeneration, false);
document.getElementById("stop-btn").addEventListener("click", stopGeneration);

function stopGeneration() {
  clearTimeout(timeoutId); // Stoppe den Timeout
  console.log("Generation stopped");
}

function startGeneration() {
  let map = generateEmptyMap();

  function iteration() {
    const tile = getTileLowestEntropy(map);
    if(tile == undefined) return;

    // Setze die Entropie der Kachel auf das ausgewählte zufällige Element
    let randomTileValue = tile.entropy[getWeightedTile(tile)];
    tile.entropy = [randomTileValue];
    tile.collapsed = true


    // check neighbouring tiles
    let tileType = tile.entropy[0];

    if(tile.north && !tile.north.collapsed)  tile.north.entropy = tile.north.entropy.filter(value => rules[tileType].north.includes(value));
    if(tile.east && !tile.east.collapsed) tile.east.entropy = tile.east.entropy.filter(value => rules[tileType].east.includes(value));
    if(tile.south && !tile.south.collapsed) tile.south.entropy = tile.south.entropy.filter(value => rules[tileType].south.includes(value));
    if(tile.west && !tile.west.collapsed) tile.west.entropy = tile.west.entropy.filter(value => rules[tileType].west.includes(value));

    drawMap(map);

    timeoutId = setTimeout(iteration, generationDelay);
  }

  iteration();
}


function drawMap(map) {
  const generatedImage = outputImageContainer;
  generatedImage.width = tileWidth * outputSize;
  generatedImage.height = tileHeight * outputSize;

  const ctx = generatedImage.getContext('2d');
  
  for (let y = 0; y < outputSize; y++) {
    for (let x = 0; x < outputSize; x++) {
      const tile = map[y][x];
      const tileX = x * tileWidth;
      const tileY = y * tileHeight;
      if (!tile.collapsed) continue;
      ctx.drawImage(image, 
                    rules[tile.entropy[0]].textureX, 
                    rules[tile.entropy[0]].textureY, 
                    tileWidth, 
                    tileHeight, 
                    tileX, 
                    tileY, 
                    tileWidth, 
                    tileHeight);
    }
  }
}

function generateEmptyMap() {
  let map = [];

  for (let y = 0; y < outputSize; y++) {
    let col = [];
    for (let x = 0; x < outputSize; x++) {
      col.push(new Tile([TILE_TYPES.land, TILE_TYPES.coast, TILE_TYPES.sea], x, y));
    }
    map.push(col);
  }

  for (let y = 0; y < outputSize; y++) {
    for (let x = 0; x < outputSize; x++) {
      let tile = map[y][x];
      if (y > 0) tile.north = map[y-1][x];
      if (y < outputSize - 1) tile.south = map[y+1][x];
      if (x > 0) tile.west = map[y][x-1];
      if (x < outputSize - 1) tile.east = map[y][x+1];
    }
  }

  return map;
}


function getTileLowestEntropy(map) {
  let lowestEntropyTiles = [];

  for (let y = 0; y < outputSize; y++) {
    for (let x = 0; x < outputSize; x++) {
      let currentTile = map[y][x];
      if (currentTile.collapsed) continue;
      
      let entropy = currentTile.entropy;
      if (lowestEntropyTiles.length == 0) lowestEntropyTiles.push(currentTile);
      else if (entropy.length < lowestEntropyTiles[0].entropy.length) lowestEntropyTiles = [currentTile];
      else if (lowestEntropyTiles[0].entropy.length == entropy.length) lowestEntropyTiles.push(currentTile);
    }
  }

  return lowestEntropyTiles[Math.floor(Math.random() * lowestEntropyTiles.length)];  
}


function getWeightedTile(tile) {
  let totalWeight = 0;

  // Berechne die Gesamtgewichtung aller Regeln in der Entropie der Kachel
  for (let i = 0; i < tile.entropy.length; i++) {
      totalWeight += rules[tile.entropy[i]].weight;
  }

  // Generiere eine zufällige Zahl zwischen 0 und der Gesamtgewichtung
  let randomWeight = Math.random() * totalWeight;

  let cumulativeWeight = 0;

  // Durchlaufe die Entropie der Kachel und wähle das zufällige Element basierend auf der Gewichtung aus
  for (let i = 0; i < tile.entropy.length; i++) {
      cumulativeWeight += rules[tile.entropy[i]].weight;
      if (randomWeight < cumulativeWeight) {
          return i;
      }
  }
  return 0;  
}