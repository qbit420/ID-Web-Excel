@echo off
REM ====== Start Student Registration Server ======

REM 1. Start Node.js server in background
start "" node server.js

REM 2. Allow server to boot up for a few seconds (adjust if needed)
timeout /t 3 >nul

REM 3. Launch browser and WAIT for it to close
REM Replace Chrome's path below if using Edge/Firefox/etc.
set "BROWSER_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"
set "SERVER_URL=http://192.168.137.1:3000"

echo Opening browser to %SERVER_URL%
start /WAIT "" "%BROWSER_PATH%" "%SERVER_URL%"

REM 4. When browser is closed, clean up and shut down Node.js server
echo Browser closed. Shutting down Node.js server...

REM 5. Kill server process (all node processes, adjust if you want finer control)
taskkill /im node.exe /f >nul 2>&1

REM 6. Any other cleanup commands here (e.g., firewall, portproxy, etc.)
REM netsh interface portproxy reset >nul 2>&1
REM netsh advfirewall firewall delete rule name="HTTP 80" >nul 2>&1

echo Server stopped. Goodbye!
exit /b