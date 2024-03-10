import "./Game2048.css";
import Modal from "react-modal";
import Vector from "../../Assets/img/Vector.svg";
import React, { useState, useEffect, useCallback } from "react";

const BOARD_SIZE = 4;

const initializeBoard = () => {
  const board = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(null)
  );
  return addRandomTile(addRandomTile(board));
};

const addRandomTile = (board) => {
  const emptyCells = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] === null) {
        emptyCells.push([i, j]);
      }
    }
  }

  if (emptyCells.length === 0) {
    return board;
  }

  const [i, j] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  board[i][j] = Math.random() < 0.9 ? 2 : 4;
  return board;
};

const Game2048 = () => {
  const [board, setBoard] = useState(initializeBoard);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [highScore, setHighScore] = useState(0);
  
  // Inside your Game2048 component
useEffect(() => {
  const handleTelegramMessage = (event) => {
    // Handle messages received from Telegram
    const message = event.data;
    if (message.command === 'restartGame') {
      restartGame();
    } else if (message.command === 'swipe') {
      handleSwipe(message.direction);
    }
  };

  // Add event listener for messages from Telegram
  window.addEventListener('message', handleTelegramMessage);

  // Cleanup the event listener on component unmount
  return () => {
    window.removeEventListener('message', handleTelegramMessage);
  };
}, [restartGame, handleSwipe]);

  const moveUp = (currentBoard) => {
    const newBoard = transposeMatrix(currentBoard);
    newBoard.forEach((row) => {
      // Remove null values
      const filteredRow = row.filter((cell) => cell !== null);

      // Merge adjacent identical tiles
      for (let i = 0; i < filteredRow.length - 1; i++) {
        if (filteredRow[i] === filteredRow[i + 1]) {
          filteredRow[i] *= 2;
          filteredRow[i + 1] = null;
        }
      }

      // Fill the row with null values to the right
      const newRow = Array(BOARD_SIZE).fill(null);
      filteredRow.forEach((cell, index) => {
        newRow[index] = cell;
      });

      row.length = 0; // Clear the original row
      Array.prototype.push.apply(row, newRow); // Copy the new values back to the original row
    });

    return transposeMatrix(newBoard);
  };

  const transposeMatrix = (matrix) => {
    return matrix[0].map((_, i) => matrix.map((row) => row[i]));
  };

  const moveDown = (currentBoard) => {
    const newBoard = transposeMatrix(currentBoard);
    newBoard.forEach((row) => {
      // Remove null values
      const filteredRow = row.filter((cell) => cell !== null);

      // Merge adjacent identical tiles
      for (let i = filteredRow.length - 1; i > 0; i--) {
        if (filteredRow[i] === filteredRow[i - 1]) {
          filteredRow[i] *= 2;
          filteredRow[i - 1] = null;
        }
      }

      // Fill the row with null values to the left
      const newRow = Array(BOARD_SIZE).fill(null);
      let newIndex = BOARD_SIZE - 1;
      filteredRow.reverse().forEach((cell) => {
        newRow[newIndex--] = cell;
      });

      row.length = 0; // Clear the original row
      Array.prototype.push.apply(row, newRow); // Copy the new values back to the original row
    });

    return transposeMatrix(newBoard);
  };

  const moveLeft = (currentBoard) => {
    const newBoard = currentBoard.map((row) => {
      // Remove null values
      const filteredRow = row.filter((cell) => cell !== null);

      // Merge adjacent identical tiles
      for (let i = 0; i < filteredRow.length - 1; i++) {
        if (filteredRow[i] === filteredRow[i + 1]) {
          filteredRow[i] *= 2;
          filteredRow[i + 1] = null;
        }
      }

      // Fill the row with null values to the right
      const newRow = Array(BOARD_SIZE).fill(null);
      filteredRow.forEach((cell, index) => {
        newRow[index] = cell;
      });

      return newRow;
    });

    return newBoard;
  };

  const moveRight = (currentBoard) => {
    const newBoard = currentBoard.map((row) => {
      // Remove null values
      const filteredRow = row.filter((cell) => cell !== null);

      // Merge adjacent identical tiles in reverse order
      for (let i = filteredRow.length - 1; i > 0; i--) {
        if (filteredRow[i] === filteredRow[i - 1]) {
          filteredRow[i] *= 2;
          filteredRow[i - 1] = null;
        }
      }

      // Fill the row with null values to the left
      const newRow = Array(BOARD_SIZE).fill(null);
      let newIndex = BOARD_SIZE - 1;
      filteredRow.reverse().forEach((cell) => {
        newRow[newIndex--] = cell;
      });

      return newRow;
    });

    return newBoard;
  };

  const restartGame = () => {
    // Reset the board, game over state, and close the modal
    setBoard(initializeBoard);
    setIsGameOver(false);
    setIsModalOpen(false);
  };

  const checkGameOver = (currentBoard) => {
    const isEmptyCell = currentBoard.some((row) => row.includes(null));

    if (!isEmptyCell) {
      // If there are no empty cells, check for possible moves
      const hasPossibleMoves = hasMoves(currentBoard);

      if (!hasPossibleMoves) {
        // No possible moves, game over
        setIsGameOver(true);
        setIsModalOpen(true);
      }
    }
    const totalScore = currentBoard
      .flat()
      .reduce((acc, cell) => acc + (cell || 0), 0);
    const storedHighScore = localStorage.getItem("highScore");

    if (!storedHighScore || totalScore > parseInt(storedHighScore, 10)) {
      localStorage.setItem("highScore", totalScore.toString());
      setHighScore(totalScore);
    }
  };
  useEffect(() => {
    const storedHighScore = localStorage.getItem("highScore");
    if (storedHighScore) {
      setHighScore(parseInt(storedHighScore, 10));
    }
  }, []);

  const hasMoves = (currentBoard) => {
    // Check for possible moves by iterating through the board
    // and comparing adjacent cells to see if they can be merged or moved

    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        const currentCell = currentBoard[i][j];

        // Check neighboring cells to the right
        if (
          j < BOARD_SIZE - 1 &&
          (currentCell === null || currentCell === currentBoard[i][j + 1])
        ) {
          return true;
        }

        // Check neighboring cells below
        if (
          i < BOARD_SIZE - 1 &&
          (currentCell === null || currentCell === currentBoard[i + 1][j])
        ) {
          return true;
        }
      }
    }

    return false;
  };

  const GameOverModal = () => (
    <Modal
      className="react-modal-content"
      isOpen={isModalOpen}
      onRequestClose={() => setIsModalOpen(false)}
      contentLabel="Game Over Modal"
      overlayClassName="react-modal-overlay"
    >
      <button className="close-button" onClick={() => setIsModalOpen(false)}>
        &#10006;
      </button>
      <h2>O’yin tugadi</h2>
      <button className="modal-restart" onClick={() => restartGame()}>
        Yangidan boshlash
      </button>
    </Modal>
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "ArrowUp") {
        setBoard((prevBoard) => {
          const newBoard = moveUp([...prevBoard]);
          checkGameOver(newBoard);
          return addRandomTile(newBoard);
        });
      } else if (event.key === "ArrowDown") {
        setBoard((prevBoard) => {
          const newBoard = moveDown([...prevBoard]);
          checkGameOver(newBoard);
          return addRandomTile(newBoard);
        });
      } else if (event.key === "ArrowLeft") {
        setBoard((prevBoard) => {
          const newBoard = moveLeft([...prevBoard]);
          checkGameOver(newBoard);
          return addRandomTile(newBoard);
        });
      } else if (event.key === "ArrowRight") {
        setBoard((prevBoard) => {
          const newBoard = moveRight([...prevBoard]);
          checkGameOver(newBoard);
          return addRandomTile(newBoard);
        });
      }
    },
    [moveUp, moveDown, moveLeft, moveRight, checkGameOver]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleTouchStart = (event) => {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  };

  const handleTouchMove = (event) => {
    event.preventDefault(); // Prevent the default behavior

    if (!touchStartX || !touchStartY) {
      return;
    }

    const touchEndX = event.touches[0].clientX;
    const touchEndY = event.touches[0].clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Determine the direction of the swipe
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        // Swipe right
        handleSwipe("ArrowRight");
      } else {
        // Swipe left
        handleSwipe("ArrowLeft");
      }
    } else {
      if (deltaY > 0) {
        // Swipe down
        handleSwipe("ArrowDown");
      } else {
        // Swipe up
        handleSwipe("ArrowUp");
      }
    }

    // Reset touch start coordinates
    touchStartX = null;
    touchStartY = null;
  };

  const handleSwipe = (direction) => {
    // Handle the swipe direction
    if (direction === "ArrowUp") {
      setBoard((prevBoard) => {
        const newBoard = moveUp([...prevBoard]);
        checkGameOver(newBoard);
        return addRandomTile(newBoard);
      });
    } else if (direction === "ArrowDown") {
      setBoard((prevBoard) => {
        const newBoard = moveDown([...prevBoard]);
        checkGameOver(newBoard);
        return addRandomTile(newBoard);
      });
    } else if (direction === "ArrowLeft") {
      setBoard((prevBoard) => {
        const newBoard = moveLeft([...prevBoard]);
        checkGameOver(newBoard);
        return addRandomTile(newBoard);
      });
    } else if (direction === "ArrowRight") {
      setBoard((prevBoard) => {
        const newBoard = moveRight([...prevBoard]);
        checkGameOver(newBoard);
        return addRandomTile(newBoard);
      });
    }
  };

  // Define touch start coordinates
  let touchStartX = null;
  let touchStartY = null;

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("touchstart", handleTouchStart, true);
    window.addEventListener("touchmove", handleTouchMove, {
      passive: false,
      capture: true,
    });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("touchstart", handleTouchStart, true);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [handleKeyDown, handleTouchStart, handleTouchMove]);
  
  return (
    <>
      <div className="App">
        <div className="box">
          <h1 className="title">2048</h1>
          <ul className="navbar-list">
            <li className="navbar-item">
              <h2 className="navbar-title">Reyting</h2>
              <img src={Vector} alt="Vector" width={30} height={22} />
            </li>
            <li className="navbar-item">
              <h2 className="navbar-title">Natija</h2>
              <p className="result">
                {board.flat().reduce((acc, cell) => acc + (cell || 0), 0)}
              </p>
            </li>
            <li className="navbar-item">
              <h2 className="navbar-title">Yuqori natija</h2>
              <p className="result">{highScore}</p>
            </li>
          </ul>
        </div>
        <button className="restart-btn" onClick={() => restartGame()}>
          Yangi o’yin
        </button>

        <div className="board">
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className="row">
              {row.map((cell, colIndex) => (
                <div
                  key={colIndex}
                  className={`cell ${cell !== null ? `value-${cell}` : ""}`}
                >
                  {cell}
                </div>
              ))}
            </div>
          ))}
        </div>
        {isGameOver && <GameOverModal />}
        <div className="rating">
          <p>Reytingdagi o’rin</p>
        </div>
      </div>
    </>
  );
};

export default Game2048;
