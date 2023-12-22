import React, { useRef, useEffect, useState } from "react";
import io from "socket.io-client";
import { Socket } from "socket.io-client";

interface MyBoard {
  brushColor: string;
  brushSize: number;
}

const Board: React.FC<MyBoard> = (props) => {
  const { brushColor, brushSize } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // const newSocket = io('http://localhost:5000');
    const newSocket = io("https://sketchsync-backend.onrender.com/");
    console.log(newSocket, "Connected to socket");
    setSocket(newSocket);
  }, []);

  useEffect(() => {
    if (socket) {
      // Event listener for receiving canvas data from the socket
      socket.on("canvasImage", (data: string) => {
        // Create an image object from the data URL
        const image = new Image();
        image.src = data;

        const canvas = canvasRef.current;
        // eslint-disable-next-line react-hooks/exhaustive-deps
        const ctx = canvas?.getContext("2d");
        // Draw the image onto the canvas
        image.onload = () => {
          ctx?.drawImage(image, 0, 0);
        };
      });
    }
  }, [socket]);

  // Function to start drawing
  useEffect(() => {
    // Variables to store drawing state
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    const startDrawing = (e: { offsetX: number; offsetY: number }) => {
      isDrawing = true;

      console.log(`drawing started`, brushColor, brushSize);
      [lastX, lastY] = [e.offsetX, e.offsetY];
    };

    /**
        const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
            e.preventDefault(); // Prevent default behavior for touch events
            isDrawing = true;

            const { clientX, clientY } = e.touches[0];
            console.log(`drawing started`, brushColor, brushSize);
            [lastX, lastY] = [clientX, clientY];
        };
         */

    // Function to draw
    const draw = (e: { offsetX: number; offsetY: number }) => {
      if (!isDrawing) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
      }

      [lastX, lastY] = [e.offsetX, e.offsetY];
    };

    /**
        const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
            e.preventDefault(); // Prevent default behavior for touch events
            if (!isDrawing) return;

            const { clientX, clientY } = e.touches[0];
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');

            if (ctx) {
                ctx.beginPath();
                ctx.moveTo(lastX, lastY);
                ctx.lineTo(clientX, clientY);
                ctx.stroke();
            }

            [lastX, lastY] = [clientX, clientY];
        };
         */

    // Function to end drawing
    const endDrawing = () => {
      const canvas = canvasRef.current;
      const dataURL = canvas?.toDataURL(); // Get the data URL of the canvas content

      // Send the dataURL or image data to the socket
      // console.log('drawing ended')
      if (socket) {
        socket.emit("canvasImage", dataURL);
        console.log("drawing ended");
      }
      isDrawing = false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      isDrawing = true;

      console.log(`drawing started`, brushColor, brushSize);

      const { clientX, clientY } = e.touches[0];
      [lastX, lastY] = [clientX, clientY];
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!isDrawing) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx) {
        const { clientX, clientY } = e.touches[0];

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(clientX, clientY);
        ctx.stroke();

        [lastX, lastY] = [clientX, clientY];
      }
    };

    const canvas: HTMLCanvasElement | null = canvasRef.current;
    const ctx = canvasRef.current?.getContext("2d");

    // Set initial drawing styles
    if (ctx) {
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
    // Event listeners for drawing
    canvas?.addEventListener("mousedown", startDrawing);
    canvas?.addEventListener("mousemove", draw);
    canvas?.addEventListener("mouseup", endDrawing);
    canvas?.addEventListener("mouseout", endDrawing);

    // canvas?.addEventListener('touchstart', startDrawingTouch, { passive: false });
    canvas?.addEventListener("touchstart", handleTouchStart);
    canvas?.addEventListener("touchmove", handleTouchMove);
    canvas?.addEventListener("touchend", endDrawing);

    return () => {
      // Clean up event listeners when component unmounts
      canvas?.removeEventListener("mousedown", startDrawing);
      canvas?.removeEventListener("mousemove", draw);
      canvas?.removeEventListener("mouseup", endDrawing);
      canvas?.removeEventListener("mouseout", endDrawing);

      canvas?.removeEventListener("touchstart", handleTouchStart);
      canvas?.removeEventListener("touchmove", handleTouchMove);
      canvas?.removeEventListener("touchend", endDrawing);
    };
  }, [brushColor, brushSize, socket]);

  const [windowSize, setWindowSize] = useState([
    window.innerWidth,
    window.innerHeight,
  ]);

  useEffect(() => {
    const handleWindowResize = () => {
      setWindowSize([window.innerWidth, window.innerHeight]);
    };

    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={windowSize[0] - 50}
      height={windowSize[1] - 100}
      style={{ backgroundColor: "white" }}
    />
  );
};

export default Board;
