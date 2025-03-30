document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const welcomeScreen = document.getElementById('welcomeScreen');
    const gameScreen = document.getElementById('gameScreen');
    const startBtn = document.getElementById('startBtn');
    const backBtn = document.getElementById('backBtn');
    const solutionBtn = document.getElementById('solutionBtn');
    const difficultyBtns = document.querySelectorAll('.difficulty-btn');
    const piecesArea = document.getElementById('piecesArea');
    const puzzleBoard = document.getElementById('puzzleBoard');
    const successMessage = document.getElementById('successMessage');
    const playAgainBtn = document.getElementById('playAgainBtn');
    const timer = document.getElementById('timer');
    
    // Variables
    let selectedDifficulty = 12; // Default: Easy
    let pieces = [];
    let placedPieces = 0;
    let imageObj = new Image();
    let timerInterval;
    let seconds = 0;
    let minutes = 0;
    let isPuzzleComplete = false;
    let draggedPiece = null;
    let offsetX, offsetY;

    // Use the Imgur image
const imgSrc = "https://i.ibb.co/bj2DtLTT/Chat-GPT-Image-Mar-30-2025-10-48-33-AM.png";

    
    // Event Listeners
    difficultyBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            difficultyBtns.forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            selectedDifficulty = parseInt(this.dataset.pieces);
        });
    });
    
    startBtn.addEventListener('click', startGame);
    backBtn.addEventListener('click', goBack);
    solutionBtn.addEventListener('click', showSolution);
    playAgainBtn.addEventListener('click', restartGame);
    
    // Initialize
    imageObj.src = imgSrc;
    imageObj.crossOrigin = "Anonymous";
    
    // Functions
    function startGame() {
        if (!document.querySelector('.difficulty-btn.selected')) {
            alert('Please select a difficulty level first!');
            return;
        }
        
        welcomeScreen.style.display = 'none';
        gameScreen.style.display = 'block';
        
        resetTimer();
        startTimer();
        createPuzzle();
    }
    
    function goBack() {
        gameScreen.style.display = 'none';
        welcomeScreen.style.display = 'block';
        clearInterval(timerInterval);
        resetPuzzle();
    }
    
    function restartGame() {
        successMessage.style.display = 'none';
        resetPuzzle();
        createPuzzle();
        resetTimer();
        startTimer();
    }
    
    function resetPuzzle() {
        pieces = [];
        placedPieces = 0;
        isPuzzleComplete = false;
        piecesArea.innerHTML = '';
        puzzleBoard.innerHTML = '';
    }
    
    function createPuzzle() {
        // Wait for image to load
        if (!imageObj.complete) {
            imageObj.onload = createPuzzle;
            return;
        }
        
        const imgWidth = Math.min(600, imageObj.naturalWidth);
        const imgHeight = Math.min(600, imageObj.naturalHeight);
        
        let rows, cols;
        
        // Set grid dimensions based on difficulty
        if (selectedDifficulty === 12) {
            rows = 3;
            cols = 4;
        } else if (selectedDifficulty === 24) {
            rows = 4;
            cols = 6;
        } else if (selectedDifficulty === 36) {
            rows = 6;
            cols = 6;
        } else if (selectedDifficulty === 50) {
            rows = 5;
            cols = 10;
        }
        
        const pieceWidth = imgWidth / cols;
        const pieceHeight = imgHeight / rows;
        
        // Resize containers
        puzzleBoard.style.width = `${imgWidth}px`;
        puzzleBoard.style.height = `${imgHeight}px`;
        piecesArea.style.width = `${imgWidth}px`;
        piecesArea.style.height = `${imgHeight + 100}px`; // Extra space for pieces
        
        // Create puzzle pieces
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const piece = document.createElement('div');
                piece.className = 'puzzle-piece';
                piece.style.width = `${pieceWidth}px`;
                piece.style.height = `${pieceHeight}px`;
                
                // Create canvas for the piece
                const canvas = document.createElement('canvas');
                canvas.width = pieceWidth;
                canvas.height = pieceHeight;
                const ctx = canvas.getContext('2d');
                
                // Draw the portion of the image
                ctx.drawImage(
                    imageObj,
                    j * pieceWidth * (imageObj.naturalWidth / imgWidth),
                    i * pieceHeight * (imageObj.naturalHeight / imgHeight),
                    pieceWidth * (imageObj.naturalWidth / imgWidth),
                    pieceHeight * (imageObj.naturalHeight / imgHeight),
                    0, 0, pieceWidth, pieceHeight
                );
                
                // Set background image from canvas
                piece.style.backgroundImage = `url(${canvas.toDataURL()})`;
                
                // Set jigsaw piece shape
                const path = generateJigsawPath(pieceWidth, pieceHeight, i, j, rows, cols);
                piece.style.clipPath = path;
                piece.style.webkitClipPath = path; // For Safari support
                
                // Store original position
                piece.dataset.row = i;
                piece.dataset.col = j;
                piece.dataset.correctX = j * pieceWidth;
                piece.dataset.correctY = i * pieceHeight;
                
                // Random position in pieces area
                const randomX = Math.floor(Math.random() * (piecesArea.offsetWidth - pieceWidth));
                const randomY = Math.floor(Math.random() * (piecesArea.offsetHeight - pieceHeight));
                piece.style.left = `${randomX}px`;
                piece.style.top = `${randomY}px`;
                
                // Add drag events
                piece.addEventListener('mousedown', startDrag);
                piece.addEventListener('touchstart', startDragTouch, { passive: false });
                
                pieces.push(piece);
                piecesArea.appendChild(piece);
            }
        }
        
        // Add drop events
        piecesArea.addEventListener('mouseup', endDrag);
        puzzleBoard.addEventListener('mouseup', endDrag);
        document.addEventListener('mousemove', dragPiece);
        
        piecesArea.addEventListener('touchend', endDragTouch);
        puzzleBoard.addEventListener('touchend', endDragTouch);
        document.addEventListener('touchmove', dragPieceTouch, { passive: false });
    }
    
    function generateJigsawPath(width, height, row, col, totalRows, totalCols) {
        const tabSize = width * 0.2;
        const notchDepth = height * 0.15;
        let path = '';
        
        // Top edge
        if (row === 0) {
            path += `M0,0 L${width},0 `;
        } else {
            path += `M0,0 L${width/2 - tabSize},0 `;
            path += `Q${width/2 - tabSize/2},${-notchDepth} ${width/2},${-notchDepth} `;
            path += `Q${width/2 + tabSize/2},${-notchDepth} ${width/2 + tabSize},0 `;
            path += `L${width},0 `;
        }
        
        // Right edge
        if (col === totalCols - 1) {
            path += `L${width},${height} `;
        } else {
            path += `L${width},${height/2 - tabSize} `;
            path += `Q${width + notchDepth},${height/2} ${width},${height/2 + tabSize} `;
            path += `L${width},${height} `;
        }
        
        // Bottom edge
        if (row === totalRows - 1) {
            path += `L0,${height} `;
        } else {
            path += `L${width},${height} L${width/2 + tabSize},${height} `;
            path += `Q${width/2},${height + notchDepth} ${width/2 - tabSize},${height} `;
            path += `L0,${height} `;
        }
        
        // Left edge
        if (col === 0) {
            path += 'Z';
        } else {
            path += `L0,${height} L0,${height/2 + tabSize} `;
            path += `Q${-notchDepth},${height/2} 0,${height/2 - tabSize} Z`;
        }
        
        return `path('${path}')`;
    }
    
    function startDrag(e) {
        e.preventDefault();
        draggedPiece = this;
        draggedPiece.classList.add('dragging');
        
        const rect = draggedPiece.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        
        if (draggedPiece.parentNode) {
            draggedPiece.parentNode.appendChild(draggedPiece);
        }
    }
    
    function startDragTouch(e) {
        e.preventDefault();
        draggedPiece = this;
        draggedPiece.classList.add('dragging');
        
        const touch = e.touches[0];
        const rect = draggedPiece.getBoundingClientRect();
        offsetX = touch.clientX - rect.left;
        offsetY = touch.clientY - rect.top;
        
        if (draggedPiece.parentNode) {
            draggedPiece.parentNode.appendChild(draggedPiece);
        }
    }
    
    function dragPiece(e) {
        if (!draggedPiece) return;
        e.preventDefault();
        
        const container = draggedPiece.parentNode.getBoundingClientRect();
        const pieceWidth = draggedPiece.offsetWidth;
        const pieceHeight = draggedPiece.offsetHeight;
        
        let newX = e.clientX - container.left - offsetX;
        let newY = e.clientY - container.top - offsetY;
        
        newX = Math.max(0, Math.min(newX, container.width - pieceWidth));
        newY = Math.max(0, Math.min(newY, container.height - pieceHeight));
        
        draggedPiece.style.left = `${newX}px`;
        draggedPiece.style.top = `${newY}px`;
    }
    
    function dragPieceTouch(e) {
        if (!draggedPiece) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        const container = draggedPiece.parentNode.getBoundingClientRect();
        const pieceWidth = draggedPiece.offsetWidth;
        const pieceHeight = draggedPiece.offsetHeight;
        
        let newX = touch.clientX - container.left - offsetX;
        let newY = touch.clientY - container.top - offsetY;
        
        newX = Math.max(0, Math.min(newX, container.width - pieceWidth));
        newY = Math.max(0, Math.min(newY, container.height - pieceHeight));
        
        draggedPiece.style.left = `${newX}px`;
        draggedPiece.style.top = `${newY}px`;
    }
    
    function endDrag(e) {
        if (!draggedPiece) return;
        
        const targetContainer = e.target.closest('#piecesArea, #puzzleBoard') || 
                               (puzzleBoard.contains(e.target) ? puzzleBoard : piecesArea);
        
        if (targetContainer === puzzleBoard) {
            checkPiecePlacement(draggedPiece);
        } else if (targetContainer === piecesArea && draggedPiece.parentNode !== piecesArea) {
            returnToPiecesArea(draggedPiece);
        }
        
        draggedPiece.classList.remove('dragging');
        draggedPiece = null;
    }
    
    function endDragTouch(e) {
        if (!draggedPiece) return;
        
        const touch = e.changedTouches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const targetContainer = element.closest('#piecesArea, #puzzleBoard') || 
                               (puzzleBoard.contains(element) ? puzzleBoard : piecesArea);
        
        if (targetContainer === puzzleBoard) {
            checkPiecePlacement(draggedPiece);
        } else if (targetContainer === piecesArea && draggedPiece.parentNode !== piecesArea) {
            returnToPiecesArea(draggedPiece);
        }
        
        draggedPiece.classList.remove('dragging');
        draggedPiece = null;
    }
    
    function checkPiecePlacement(piece) {
        const pieceRect = piece.getBoundingClientRect();
        const boardRect = puzzleBoard.getBoundingClientRect();
        
        const relativeX = pieceRect.left - boardRect.left;
        const relativeY = pieceRect.top - boardRect.top;
        
        const correctX = parseInt(piece.dataset.correctX);
        const correctY = parseInt(piece.dataset.correctY);
        
        const threshold = 30; // Snap threshold
        
        if (Math.abs(relativeX - correctX) < threshold && Math.abs(relativeY - correctY) < threshold) {
            // Snap to correct position
            piece.style.left = `${correctX}px`;
            piece.style.top = `${correctY}px`;
            piece.classList.add('placed');
            
            if (piece.parentNode !== puzzleBoard) {
                puzzleBoard.appendChild(piece);
                placedPieces++;
            }
            
            if (placedPieces === pieces.length) {
                puzzleComplete();
            }
        } else if (piece.parentNode !== puzzleBoard) {
            puzzleBoard.appendChild(piece);
        }
    }
    
    function returnToPiecesArea(piece) {
        if (piece.classList.contains('placed')) {
            piece.classList.remove('placed');
            placedPieces--;
        }
        
        const pieceRect = piece.getBoundingClientRect();
        const areaRect = piecesArea.getBoundingClientRect();
        
        const newX = pieceRect.left - areaRect.left;
        const newY = pieceRect.top - areaRect.top;
        
        piecesArea.appendChild(piece);
        piece.style.left = `${newX}px`;
        piece.style.top = `${newY}px`;
    }
    
    function puzzleComplete() {
        isPuzzleComplete = true;
        clearInterval(timerInterval);
        successMessage.style.display = 'flex';
    }
    
    function showSolution() {
        pieces.forEach(piece => {
            const correctX = parseInt(piece.dataset.correctX);
            const correctY = parseInt(piece.dataset.correctY);
            
            piece.style.left = `${correctX}px`;
            piece.style.top = `${correctY}px`;
            piece.classList.add('placed');
            
            puzzleBoard.appendChild(piece);
        });
        
        placedPieces = pieces.length;
        clearInterval(timerInterval);
    }
    
    function startTimer() {
        seconds = 0;
        minutes = 0;
        updateTimerDisplay();
        
        timerInterval = setInterval(() => {
            seconds++;
            if (seconds >= 60) {
                seconds = 0;
                minutes++;
            }
            updateTimerDisplay();
        }, 1000);
    }
    
    function resetTimer() {
        clearInterval(timerInterval);
        seconds = 0;
        minutes = 0;
        updateTimerDisplay();
    }
    
    function updateTimerDisplay() {
        const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
        timer.textContent = `${formattedMinutes}:${formattedSeconds}`;
    }
    
    // Initialize first difficulty button as selected
    difficultyBtns[0].classList.add('selected');
});
