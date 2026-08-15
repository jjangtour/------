Write-Host "Stopping MySQL server..." -ForegroundColor Yellow
$mysqlAdmin = "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqladmin.exe"

# MySQL이 실행 중인지 확인
$running = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue
if (-not $running) {
    Write-Host "MySQL is not running." -ForegroundColor Yellow
    exit
}

# mysqladmin을 사용한 안전한 종료 요청
& $mysqlAdmin -u root shutdown

Start-Sleep -Seconds 2
$running = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue
if (-not $running) {
    Write-Host "MySQL server stopped successfully." -ForegroundColor Green
} else {
    Write-Host "MySQL did not stop gracefully. Forcing termination..." -ForegroundColor Red
    Stop-Process -Name "mysqld" -Force
}
