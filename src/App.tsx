import { useEffect, useRef } from 'react';
import { createGame } from './game/Game.ts';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const game = createGame(canvasRef.current!);
    return game.destroy;
  }, []);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000',
      overflow: 'hidden',
      margin: 0,
      padding: 0
    }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          imageRendering: 'pixelated',
          cursor: 'crosshair'
        }}
      />
    </div>
  );
}
