document.addEventListener("DOMContentLoaded", requestNotificationPermission);

let map = L.map('map').setView([52.215278, 21.035791], 18);
L.tileLayer.provider('Esri.WorldImagery').addTo(map);
let marker = L.marker([52.215278, 21.035791]).addTo(map);
marker.bindPopup("<strong>Witaj!</strong><br>To początkowa lokalizacja.").openPopup();

document.getElementById("saveButton").addEventListener("click", function() {
    leafletImage(map, function (err, canvas) {
        if (err) {
            console.error("Error generating image: ", err);
            return;
        }
        let rasterMap = document.getElementById("rasterMap");

        rasterMap.width = canvas.width;
        rasterMap.height = canvas.height;

        let rasterContext = rasterMap.getContext("2d");
        rasterContext.drawImage(canvas, 0, 0, canvas.width, canvas.height);
        
        rasterMap.style.display = "block";
        createPuzzles(canvas);
    });
});

function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }
}

function createPuzzles(originalCanvas) {
    const puzzleContainer = document.getElementById("puzzleContainer");
    puzzleContainer.innerHTML = "";
    const pieceWidth = originalCanvas.width / 4;
    const pieceHeight = originalCanvas.height / 4;
    const pieces = [];

    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            let pieceCanvas = document.createElement('canvas');
            pieceCanvas.width = pieceWidth;
            pieceCanvas.height = pieceHeight;
            let context = pieceCanvas.getContext('2d');
            context.drawImage(originalCanvas, col * pieceWidth, row * pieceHeight, pieceWidth, pieceHeight, 0, 0, pieceWidth, pieceHeight);

            let puzzlePiece = document.createElement('div');
            puzzlePiece.className = 'puzzle-piece';
            puzzlePiece.draggable = true;
            puzzlePiece.appendChild(pieceCanvas);

            puzzlePiece.dataset.correctPosition = `${col},${row}`;
            puzzlePiece.dataset.isPlaced = 'false';
            puzzlePiece.addEventListener("dragstart", handleDragStart);
            pieces.push(puzzlePiece);
        }
    }

    shuffleArray(pieces);
    pieces.forEach(piece => puzzleContainer.appendChild(piece));

    const dropArea = document.getElementById("dropArea");
    dropArea.innerHTML = "";
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            let gridCell = document.createElement('div');
            gridCell.className = 'drop-area';
            gridCell.dataset.correctPosition = `${col},${row}`;
            dropArea.appendChild(gridCell);
            gridCell.addEventListener("dragover", (e) => e.preventDefault());
            gridCell.addEventListener("drop", (e) => placePiece(e.dataTransfer.getData("text/plain"), gridCell));
        }
    }
}

function handleDragStart(e) {
    e.dataTransfer.setData("text/plain", e.target.dataset.correctPosition);
}

function placePiece(droppedPosition, targetCell) {
    const puzzlePiece = document.querySelector(`.puzzle-piece[data-correct-position='${droppedPosition}']`);
    if (puzzlePiece && targetCell.dataset.correctPosition === droppedPosition) {
        targetCell.appendChild(puzzlePiece);
        puzzlePiece.dataset.isPlaced = 'true';
        checkCompletion();
    }
}

function checkCompletion() {
    if (document.querySelectorAll(".puzzle-piece[data-is-placed='true']").length === 16) {
        document.getElementById("win-screen").style.visibility = "visible";
        showSystemNotification();
    }
}

function showSystemNotification() {
    if (Notification.permission === "granted") {
        new Notification("Congratulations!", { body: "You successfully completed the puzzle!" });
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

document.getElementById("replay-button").addEventListener("click", resetGame);

function resetGame() {
    document.getElementById("win-screen").style.visibility = "hidden";
    createPuzzles(document.getElementById("rasterMap"));
}

document.getElementById("getLocation").addEventListener("click", function() {
    if (!navigator.geolocation) {
        console.log("No geolocation support.");
        return;
    }

    navigator.geolocation.getCurrentPosition(position => {
        let lat = position.coords.latitude;
        let lon = position.coords.longitude;
        map.setView([lat, lon], 18);
        L.marker([lat, lon]).addTo(map).bindPopup("Jesteś tutaj!").openPopup();
        console.log(`Location updated: ${lat}, ${lon}`);
    }, positionError => {
        console.error("Error getting location: ", positionError);
    });
});