# 📚 Student Registration System

A lightweight **offline-first** student registration system built with:  
- ✅ **HTML, CSS, JavaScript** (frontend)  
- ✅ **ExcelJS** (export registrations to Excel)  
- ✅ **Service Worker** (works offline, PWA-ready)  
- ✅ **Express.js** (local web server for distribution via hotspot)  

---

## 🚀 Features
- Student registration form with signature capture ✍️  
- Admin page with student list and Excel export 📊  
- Data stored in browser **LocalStorage**  
- Works **offline** (PWA support)  
- Easy to host via **Express.js + WiFi hotspot**  
- Custom **school logo** support  

---

## 🖼 Adding Your Logo
1. Put your logo file (example: `logo.png`) inside the `public/` folder.  
   ```
   project/
   ├── server.js
   ├── package.json
   └── public/
       ├── student.html
       ├── style.css
       ├── script.js
       ├── logo.png   ✅ your logo here
   ```
2. Open `student.html` and add:  
   ```html
   <img src="logo.png" alt="School Logo" class="logo">
   ```
3. Style in `style.css`:  
   ```css
   .logo {
     display: block;
     max-width: 120px;
     margin: 0 auto 15px;
   }
   ```

---

## 🛠 Installation  

### 1. Install [Node.js](https://nodejs.org/)  
Check if installed:  
```bash
node -v
```

### 2. Clone or download this repo  

```bash
git clone https://github.com/your-username/student-registration.git
cd student-registration
```

### 3. Install dependencies  

```bash
npm install express
```

(ExcelJS + FileSaver are already included in `/public/libs/` ✅)  

---

## ▶️ Running the Server  

Start the server:  
```bash
node server.js
```

Then open:  
```
http://localhost:3000
```

---

## 🖥 Auto-Start (Windows Only)  

Use the included **`start-server.bat`** file to:  
- Start your Node server  
- Auto-open the browser to `http://localhost:3000`  

Just double-click `start-server.bat`.  

---

## 📦 Exporting Data  
- Open the **Admin Page** (`admin.html`)  
- Click **Export to Excel** → downloads `registrations.xlsx` with signatures  

---

## 📱 Deployment Tips
- Share WiFi hotspot from your PC  
- Other devices connect and access:  
  ```
  http://<your-pc-ip>:3000
  ```
- Example: `http://192.168.1.10:3000`  
