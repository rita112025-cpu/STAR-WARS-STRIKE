import { CANVAS_H, CANVAS_W } from './config.ts';

export interface InputState {
  keys: Record<string, boolean>;
  pointerDown: boolean;
  touchActive: boolean;
  pointerX: number; // 畫布座標
  pointerY: number;
}

export interface InputHandlers {
  onKeyDown(code: string, repeat: boolean): void;
  /** 點擊 / 觸控開始。回傳 true 表示已被選單等畫面處理，不更新指標位置。 */
  onPress(): boolean;
}

const SCROLL_KEYS = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

export function createInputState(): InputState {
  return { keys: {}, pointerDown: false, touchActive: false, pointerX: CANVAS_W / 2, pointerY: CANVAS_H - 100 };
}

export function releaseAll(input: InputState): void {
  input.keys = {};
  input.pointerDown = false;
  input.touchActive = false;
}

/** 綁定鍵盤、滑鼠、觸控事件，回傳解除綁定的函式。 */
export function attachInput(canvas: HTMLCanvasElement, input: InputState, handlers: InputHandlers): () => void {
  function setPointer(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    input.pointerX = (clientX - rect.left) * (CANVAS_W / rect.width);
    input.pointerY = (clientY - rect.top) * (CANVAS_H / rect.height);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (SCROLL_KEYS.includes(e.code)) e.preventDefault();
    handlers.onKeyDown(e.code, e.repeat);
  }
  function onKeyUp(e: KeyboardEvent) {
    input.keys[e.code] = false;
  }
  function onMouseDown(e: MouseEvent) {
    input.pointerDown = true;
    if (!handlers.onPress()) setPointer(e.clientX, e.clientY);
  }
  function onMouseUp() {
    input.pointerDown = false;
  }
  function onMouseMove(e: MouseEvent) {
    setPointer(e.clientX, e.clientY);
  }
  function onTouchStart(e: TouchEvent) {
    e.preventDefault();
    input.touchActive = true;
    if (!handlers.onPress()) setPointer(e.touches[0].clientX, e.touches[0].clientY);
  }
  function onTouchMove(e: TouchEvent) {
    e.preventDefault();
    setPointer(e.touches[0].clientX, e.touches[0].clientY);
  }
  function onTouchEnd(e: TouchEvent) {
    e.preventDefault();
    input.touchActive = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd, { passive: false });

  return () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    canvas.removeEventListener('mousedown', onMouseDown);
    canvas.removeEventListener('mouseup', onMouseUp);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('touchstart', onTouchStart);
    canvas.removeEventListener('touchmove', onTouchMove);
    canvas.removeEventListener('touchend', onTouchEnd);
  };
}
