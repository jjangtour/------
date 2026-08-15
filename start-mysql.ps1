Write-Host "Starting MySQL server..." -ForegroundColor Green
$mysqlBin = "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe"
$dataDir = "c:\haemileum\mysql-data"

# MySQL이 이미 실행 중인지 확인
$running = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue
if ($running) {
    Write-Host "MySQL is already running." -ForegroundColor Yellow
    exit
}

# 백그라운드로 MySQL 시작 (콘솔 창 없이 실행)
Start-Process $mysqlBin -ArgumentList "--datadir=`"$dataDir`" --console" -WindowStyle Hidden
Start-Sleep -Seconds 3

# 실행 상태 확인
$running = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue
if ($running) {
    Write-Host "MySQL server started successfully." -ForegroundColor Green
    Write-Host "You can now connect to MySQL using: mysql -u root" -ForegroundColor Cyan
} else {
    Write-Host "Failed to start MySQL server. Please check the logs." -ForegroundColor Red
}
