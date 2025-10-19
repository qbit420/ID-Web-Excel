const express = require("express");
const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const ExcelJS = require("exceljs");
const os = require("os");
const qrcode = require("qrcode-terminal");

const app = express();
const PORT = process.env.PORT || 3000;

// ====== persistence ======
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "registrations.json");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let registrations = [];
(async () => {
  try {
    const raw = await fsp.readFile(DATA_FILE, "utf8");
    registrations = JSON.parse(raw);
    if (!Array.isArray(registrations)) registrations = [];
    console.log(`📦 Loaded ${registrations.length} registrations from disk.`);
  } catch {
    registrations = [];
    console.log("📦 No previous data found, starting fresh.");
  }
})();

let saveTimer = null;
function saveToDisk() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      await fsp.writeFile(DATA_FILE, JSON.stringify(registrations, null, 2), "utf8");
      console.log("💾 Data saved to disk.");
    } catch (e) {
      console.error("💥 Failed saving data:", e);
    }
  }, 200);
}

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, async () => {
    console.log(`\n🛑 ${sig} received, saving data...`);
    try {
      await fsp.writeFile(DATA_FILE, JSON.stringify(registrations, null, 2), "utf8");
    } catch (e) {
      console.error("💥 Save on shutdown failed:", e);
    }
    process.exit(0);
  });
}

// ====== admin auth (HTTP Basic) ======
const ADMIN_PIN = process.env.ADMIN_PIN || "1234";
function requireAdmin(req, res, next) {
  const hdr = req.headers.authorization || "";
  const [, b64] = hdr.split(" ");
  if (!b64) {
    res.set("WWW-Authenticate", 'Basic realm="Admin"');
    return res.status(401).send("Auth required");
  }
  const [user, pass] = Buffer.from(b64, "base64").toString().split(":");
  if (pass === ADMIN_PIN) return next();
  res.set("WWW-Authenticate", 'Basic realm="Admin"');
  return res.status(401).send("Unauthorized");
}

// ====== middleware ======
app.use(express.json({ limit: "12mb" }));

// Serve static from the project root (files live here)
app.use(
  express.static(__dirname, {
    index: false,
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-store");
      } else {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  })
);

// ====== admin page (optional file) ======
app.get(["/admin.html", "/admin"], requireAdmin, (_req, res) => {
  const adminPath = path.join(__dirname, "admin.html");
  if (fs.existsSync(adminPath)) return res.sendFile(adminPath);
  res.status(404).send("Admin UI not found (admin.html).");
});

// ====== API ======
app.get("/api/ping", (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.get("/api/registrations", requireAdmin, (_req, res) => {
  res.json(registrations);
});

app.post("/api/register", (req, res) => {
  const entry = req.body || {};

  // Normalize signature to always be PNG with full data URL
  if (entry.signature) {
    if (!entry.signature.startsWith("data:image")) {
      entry.signature = "data:image/png;base64," + entry.signature;
    }
    entry.signature = entry.signature.replace(/^data:image\/[^;]+/, "data:image/png");
  }

  entry.entryTime = entry.entryTime || new Date().toLocaleString();
  registrations.push(entry);
  saveToDisk();
  res.json({ success: true });
});

app.delete("/api/registrations", requireAdmin, (_req, res) => {
  registrations = [];
  saveToDisk();
  res.json({ success: true });
});

app.get("/api/export", requireAdmin, async (_req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Registrations");

    const headers = [
      "Name","Grade","Section","LRN","Emergency",
      "Address","Contact","Birthdate","Condition",
      "Signature","Image Code","Entry Time"
    ];
    ws.addRow(headers);

    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1976D2" } };
    headerRow.height = 25;

    let rowIndex = 2;
    for (const student of registrations) {
      const row = ws.addRow([
        student.name, student.grade, student.section, student.lrn,
        student.emergency, student.address, student.contact,
        student.birthdate, student.condition, "",
        student.imageCode, student.entryTime
      ]);
      row.height = 80;

      if (student.signature) {
        try {
          const imageId = workbook.addImage({
            base64: student.signature, // includes data URL
            extension: "png",
          });
          ws.addImage(imageId, {
            tl: { col: 9, row: rowIndex - 1 }, // J
            br: { col: 10, row: rowIndex },
            editAs: "oneCell"
          });
        } catch (err) {
          console.error("⚠️ Failed to insert signature image:", err.message);
        }
      }
      rowIndex++;
    }

    // Auto column widths
    ws.columns.forEach((col, i) => {
      if (i + 1 === 10) {
        col.width = 30; // Signature column wide
      } else {
        let maxLength = 12;
        col.eachCell({ includeEmpty: true }, cell => {
          const len = cell.value ? cell.value.toString().length : 0;
          if (len > maxLength) maxLength = len;
        });
        col.width = maxLength + 2;
      }
    });

    res.setHeader("Content-Type","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition","attachment; filename=registrations.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (e) {
    console.error("Export failed", e);
    res.status(500).send("Export failed");
  }
});

// ====== student landing ======
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "student.html"));
});

// Handle unknown routes gracefully
app.use((_req, res) => {
  res.status(404).send("Page not found");
});

// ====== start ======
app.listen(PORT, "0.0.0.0", () => {
  let localIP = "localhost";
  try {
    const nets = os.networkInterfaces();
    for (const ni of Object.values(nets || {})) {
      for (const net of ni || []) {
        if (net.family === "IPv4" && !net.internal) {
          localIP = net.address;
        }
      }
    }
  } catch (e) {
    console.warn("⚠️ Could not detect local IP, defaulting to localhost");
  }

  const url = `http://${localIP}:${PORT}`;
  console.log(`✅ Server running at: ${url}`);

  try {
    console.log("📱 Scan this on your phone:");
    qrcode.generate(url, { small: true });
  } catch (e) {
    console.warn("⚠️ QR code generation failed:", e.message);
  }

  if (ADMIN_PIN === "1234") {
    console.warn("⚠️ Default ADMIN_PIN=1234 in use. Set a stronger PIN with ENV ADMIN_PIN.");
  } else {
    console.log(`🔐 Admin PIN set (current: ${ADMIN_PIN}).`);
  }
});
