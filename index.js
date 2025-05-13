
  // Theme toggle
  function toggleTheme() {
    const currentTheme = document.body.classList.contains('dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.classList.remove(currentTheme);
    document.body.classList.add(newTheme);
    localStorage.setItem('theme', newTheme);
  }

  // Load saved theme
  window.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.add(savedTheme);
  });

  // DOM & Canvas Setup
  const mouseArea = document.getElementById("mouseArea");
  const canvas = document.getElementById("drawCanvas");
  const ctx = canvas.getContext("2d");
  const pointer = document.getElementById("pointer");

  const colorPicker = document.getElementById("colorPicker");
  const sizePicker = document.getElementById("sizePicker");
  const drawModeSelector = document.getElementById("drawMode");
  const textInput = document.getElementById("textInput");
  const textSizeInput = document.getElementById("textSize");

  let isDrawing = false;
  let lastX = 0, lastY = 0;
  let shapeStartX = 0, shapeStartY = 0;
  let isEraser = false;
  let isCursorHidden = false;
  let drawMode = "draw";
  const history = [];
  let step = -1;

  function initializeCanvas() {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  }

  function saveState() {
    step++;
    if (step < history.length) history.length = step;
    history.push(canvas.toDataURL());
  }

  function restoreState(index) {
    let img = new Image();
    img.src = history[index];
    img.onload = () => ctx.drawImage(img, 0, 0);
  }

  function undo() {
    if (step > 0) {
      step--;
      restoreState(step);
    }
  }

  function redo() {
    if (step < history.length - 1) {
      step++;
      restoreState(step);
    }
  }

  function toggleEraser() {
    isEraser = !isEraser;
    colorPicker.disabled = isEraser;
  }

  function hideMouse() {
    isCursorHidden = true;
    mouseArea.style.cursor = "none";
    pointer.style.display = "none";
  }

  function showMouse() {
    isCursorHidden = false;
    mouseArea.style.cursor = "crosshair";
    pointer.style.display = "block";
  }

  drawModeSelector.addEventListener("change", () => {
    drawMode = drawModeSelector.value;
    const isText = drawMode === "text";
    textInput.style.display = isText ? "inline-block" : "none";
    textSizeInput.style.display = isText ? "inline-block" : "none";
  });

  function getRelativePos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches?.[0]?.clientX ?? 0);
    const clientY = e.clientY || (e.touches?.[0]?.clientY ?? 0);
  
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
  
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }
  
  

  function startDrawing(e) {
    const pos = getRelativePos(e);
    lastX = pos.x;
    lastY = pos.y;
    isDrawing = true;
    saveState();
  }

  function drawLine(e) {
    const pos = getRelativePos(e);

    if (!isCursorHidden) {
      const areaRect = mouseArea.getBoundingClientRect();
      pointer.style.left = `${e.clientX - areaRect.left}px`;
      pointer.style.top = `${e.clientY - areaRect.top}px`;
      
    }

    if (isDrawing && drawMode === "draw") {
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = isEraser ? "#FFFFFF" : colorPicker.value;
      ctx.lineWidth = sizePicker.value;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.closePath();
      lastX = pos.x;
      lastY = pos.y;
    }
  }

  function stopDrawing() {
    isDrawing = false;
  }

  function clearCanvas() {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  }

  function saveCanvas() {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");

    tempCtx.fillStyle = "#FFFFFF";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0);

    const link = document.createElement("a");
    link.download = "drawing.png";
    link.href = tempCanvas.toDataURL("image/png");
    link.click();
  }

  // Events: Mouse
  mouseArea.addEventListener("mousedown", e => {
    if (drawMode === "draw") {
      startDrawing(e);
    } else if (drawMode === "rect" || drawMode === "circle") {
      const pos = getRelativePos(e);
      shapeStartX = pos.x;
      shapeStartY = pos.y;
      isDrawing = true;
      saveState();
    } else if (drawMode === "text") {
      const pos = getRelativePos(e);
      const text = textInput.value;
      const size = textSizeInput.value;
      if (text.trim()) {
        ctx.font = `${size}px Arial`;
        ctx.fillStyle = colorPicker.value;
        ctx.fillText(text, pos.x, pos.y);
        saveState();
      }
    }
  });

  mouseArea.addEventListener("mousemove", e => drawLine(e));
  mouseArea.addEventListener("mouseup", e => {
    if (drawMode === "draw") stopDrawing();
    else if ((drawMode === "rect" || drawMode === "circle") && isDrawing) {
      const pos = getRelativePos(e);
      const width = pos.x - shapeStartX;
      const height = pos.y - shapeStartY;

      ctx.beginPath();
      ctx.lineWidth = sizePicker.value;
      ctx.strokeStyle = colorPicker.value;

      if (drawMode === "rect") {
        ctx.rect(shapeStartX, shapeStartY, width, height);
      } else if (drawMode === "circle") {
        const radius = Math.sqrt(width ** 2 + height ** 2);
        ctx.arc(shapeStartX, shapeStartY, radius, 0, 2 * Math.PI);
      }

      ctx.stroke();
      ctx.closePath();
      isDrawing = false;
      saveState();
    }
  });

  mouseArea.addEventListener("mouseleave", stopDrawing);

  // Touch Support
  mouseArea.addEventListener("touchstart", e => {
    e.preventDefault();
    if (drawMode === "draw") {
      startDrawing(e);
    } else if (drawMode === "text") {
      const pos = getRelativePos(e);
      const text = textInput.value;
      const size = textSizeInput.value;
      if (text.trim()) {
        ctx.font = `${size}px Arial`;
        ctx.fillStyle = colorPicker.value;
        ctx.fillText(text, pos.x, pos.y);
        saveState();
      }
    }
  });

  mouseArea.addEventListener("touchmove", e => {
    e.preventDefault();
    drawLine(e);
  });

  mouseArea.addEventListener("touchend", stopDrawing);
  mouseArea.addEventListener("touchcancel", stopDrawing);

  initializeCanvas();
  

