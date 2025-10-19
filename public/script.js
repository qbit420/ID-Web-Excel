// ========== STUDENT FORM (Robust, single-init, adaptive signature) ==========
(function () {
  // Prevent accidental double init
  if (window.__studentFormInit) return;
  window.__studentFormInit = true;

  function setupStudentForm(formId, previewId, fullCanvasId) {
    console.log("⚡ setupStudentForm initialized");

    // --- Element references (precise and linked to HTML) ---
    const form = document.getElementById(formId);
    const signaturePreview = document.getElementById(previewId);
    const fullSignaturePad = document.getElementById(fullCanvasId);
    const modal = document.getElementById("signatureModal");
    const saveBtn = document.getElementById("saveSignature");
    const closeBtn = document.getElementById("closeSignature");
    const resetBtn = document.getElementById("resetSignature");
    const openSignatureBtn = document.getElementById("openSignature");
    const clearPreviewBtn = document.getElementById("clearSignature");

    // --- Defensive checks for every required element ---
    if (!form) return console.error("❌ Missing: #"+formId);
    if (!signaturePreview) return console.error("❌ Missing: #"+previewId);
    if (!fullSignaturePad) return console.error("❌ Missing: #"+fullCanvasId);
    if (!modal) return console.error("❌ Missing: #signatureModal");
    if (!openSignatureBtn) return console.error("❌ Missing: #openSignature button");
    if (!saveBtn) return console.error("❌ Missing: #saveSignature button");
    if (!closeBtn) return console.error("❌ Missing: #closeSignature button");
    if (!resetBtn) return console.error("❌ Missing: #resetSignature button");
    if (!clearPreviewBtn) return console.error("❌ Missing: #clearSignature button");

    const fullCtx = fullSignaturePad.getContext("2d");

    // --- Canvas Initialization, always white background ---
    function initFullCanvas(preserveImage = null) {
      console.log("🎨 initFullCanvas");
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect = fullSignaturePad.getBoundingClientRect();
      const displayWidth = Math.max(Math.floor(rect.width), 300);
      const displayHeight = Math.max(Math.floor(rect.height), 150);

      // Preserve previous image if resizing
      const oldImg = preserveImage ? new Image() : null;
      if (preserveImage) oldImg.src = preserveImage;

      fullSignaturePad.width = displayWidth * ratio;
      fullSignaturePad.height = displayHeight * ratio;
      fullSignaturePad.style.width = "100%";
      fullSignaturePad.style.height = "100%";
      fullCtx.setTransform(1, 0, 0, 1, 0, 0);
      fullCtx.scale(ratio, ratio);

      // White background (avoid transparent PNG)
      fullCtx.fillStyle = "#fff";
      fullCtx.fillRect(0, 0, displayWidth, displayHeight);

      if (oldImg) {
        oldImg.onload = () => {
          fullCtx.drawImage(oldImg, 0, 0, displayWidth, displayHeight);
          console.log("🖼 Restored preserved image");
        };
      }
    }

    function resizeAll(preserve = true) {
      console.log("📱 resizeAll");
      const fullImg = preserve ? fullSignaturePad.toDataURL("image/png") : null;
      initFullCanvas(fullImg);
    }

    function shouldResize() {
      return modal.classList.contains("show");
    }
    window.addEventListener("resize", () => { if (shouldResize()) resizeAll(true); });
    window.addEventListener("orientationchange", () => { if (shouldResize()) resizeAll(true); });

    // --- Signature Drawing Logic ---
    function enableDrawing(canvas, ctx) {
      console.log("✏️ enableDrawing");
      let drawing = false;
      let lastPos = {x:0, y:0};

      function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches?.[0]?.clientX ?? e.clientX;
        const clientY = e.touches?.[0]?.clientY ?? e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
      }

      function start(e) {
        e.preventDefault();
        drawing = true;
        lastPos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(lastPos.x, lastPos.y);
      }
      function move(e) {
        if (!drawing) return;
        e.preventDefault();
        const { x, y } = getPos(e);
        ctx.lineTo(x, y);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.stroke();
        lastPos = {x, y};
      }
      function end(e) {
        e?.preventDefault();
        drawing = false;
      }

      // Mouse Events
      canvas.addEventListener("mousedown", start);
      canvas.addEventListener("mousemove", move);
      canvas.addEventListener("mouseup", end);
      canvas.addEventListener("mouseleave", end);

      // Touch Events
      canvas.addEventListener("touchstart", start, { passive: false });
      canvas.addEventListener("touchmove", move, { passive: false });
      canvas.addEventListener("touchend", end);
    }

    enableDrawing(fullSignaturePad, fullCtx);

    // --- Utility for Clearing Canvas ---
    function clearCanvas(canvas, ctx, fill = "#fff") {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    // --- Signature Modal Controls ---
    openSignatureBtn.addEventListener("click", () => {
      console.log("🟢 Add Signature clicked");
      // Remove inline style if present
      modal.style.display = "";
      modal.classList.add("show");
      modal.setAttribute("aria-hidden", "false");
      requestAnimationFrame(() => resizeAll(true));
    });

    saveBtn.addEventListener("click", () => {
      console.log("💾 Save Signature clicked");
      const dataUrl = fullSignaturePad.toDataURL("image/png");
      signaturePreview.src = dataUrl;
      signaturePreview.classList.remove("empty");
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
    });

    closeBtn.addEventListener("click", () => {
      console.log("❌ Cancel Signature clicked");
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
    });

    resetBtn.addEventListener("click", () => {
      console.log("🧹 Clear Signature Canvas clicked");
      clearCanvas(fullSignaturePad, fullCtx);
    });

    clearPreviewBtn.addEventListener("click", () => {
      console.log("🗑 Clear Signature Preview clicked");
      signaturePreview.src = "";
      signaturePreview.classList.add("empty");
      clearCanvas(fullSignaturePad, fullCtx);
    });

    // Close modal by clicking outside modal-content
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        console.log("🖼 Modal background clicked");
        modal.classList.remove("show");
        modal.setAttribute("aria-hidden", "true");
      }
    });

    // --- Form Submit, linked to every input ---
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("📨 Form submit");

      const signatureData = signaturePreview.src && !signaturePreview.classList.contains("empty")
        ? signaturePreview.src
        : "";

      const data = {
        name: document.getElementById("name").value,
        grade: document.getElementById("grade").value,
        section: document.getElementById("section").value,
        lrn: document.getElementById("lrn").value,
        emergency: document.getElementById("emergency").value,
        address: document.getElementById("address").value,
        contact: document.getElementById("contact").value,
        birthdate: document.getElementById("birthdate").value,
        condition: document.getElementById("condition").value,
        signature: signatureData,
        imageCode: document.getElementById("imageCode").value,
        entryTime: new Date().toLocaleString()
      };

      try {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });

        if (res.ok) {
          form.reset();
          signaturePreview.src = "";
          signaturePreview.classList.add("empty");
          clearCanvas(fullSignaturePad, fullCtx);
          alert("✅ Registration submitted!");
        } else {
          alert("❌ Failed to submit registration. Try again.");
        }
      } catch (err) {
        console.error("🚨 Network error:", err);
        alert("❌ Network error. Please try again later.");
      }
    });

    // --- Initial state ---
    signaturePreview.src = "";
    signaturePreview.classList.add("empty");
    initFullCanvas();
  }

  // Ensure DOM is ready before running setup
  document.addEventListener("DOMContentLoaded", () => {
    console.log("🌍 DOM ready → setupStudentForm");
    setupStudentForm("regForm", "signaturePreview", "fullSignaturePad");
  });

  // Expose for testing/manual init if needed (won't double-init)
  window.setupStudentForm = window.setupStudentForm || setupStudentForm;
})();

