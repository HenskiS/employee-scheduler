# setup-backup-tasks.ps1
# Run as Administrator to set up Windows Task Scheduler tasks

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectPath,
    
    [Parameter(Mandatory=$false)]
    [string]$NodePath = "node"
)

Write-Host "Setting up backup tasks for scheduling app..." -ForegroundColor Green
Write-Host "Project Path: $ProjectPath" -ForegroundColor Yellow

# Verify paths exist
if (!(Test-Path $ProjectPath)) {
    Write-Error "Project path does not exist: $ProjectPath"
    exit 1
}

$ScriptPath = Join-Path $ProjectPath "scripts\backupScript.js"
if (!(Test-Path $ScriptPath)) {
    Write-Error "Backup script not found: $ScriptPath"
    exit 1
}

# Task 1: Hourly Backup
Write-Host "Creating hourly backup task..." -ForegroundColor Cyan

$Action1 = New-ScheduledTaskAction -Execute $NodePath -Argument "$ScriptPath backup" -WorkingDirectory $ProjectPath
$Trigger1 = New-ScheduledTaskTrigger -Once -At (Get-Date).Date -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration (New-TimeSpan -Days 365)
$Settings1 = New-ScheduledTaskSettingsSet -StartWhenAvailable

Register-ScheduledTask -TaskName "SchedulingApp-HourlyBackup" -Action $Action1 -Trigger $Trigger1 -Settings $Settings1 -Description "Creates hourly backups of scheduling app database" -Force

# Task 2: Daily Maintenance (2 AM)
Write-Host "Creating daily maintenance task..." -ForegroundColor Cyan

$Action2 = New-ScheduledTaskAction -Execute $NodePath -Argument "$ScriptPath full" -WorkingDirectory $ProjectPath
$Trigger2 = New-ScheduledTaskTrigger -Daily -At "2:00AM"
$Settings2 = New-ScheduledTaskSettingsSet -StartWhenAvailable

Register-ScheduledTask -TaskName "SchedulingApp-DailyMaintenance" -Action $Action2 -Trigger $Trigger2 -Settings $Settings2 -Description "Daily backup maintenance (promote and cleanup)" -Force

# Task 3: Weekly Cleanup (Sunday 3 AM)
Write-Host "Creating weekly cleanup task..." -ForegroundColor Cyan

$Action3 = New-ScheduledTaskAction -Execute $NodePath -Argument "$ScriptPath cleanup" -WorkingDirectory $ProjectPath
$Trigger3 = New-ScheduledTaskTrigger -Weekly -WeeksInterval 1 -DaysOfWeek Sunday -At "3:00AM"
$Settings3 = New-ScheduledTaskSettingsSet -StartWhenAvailable

Register-ScheduledTask -TaskName "SchedulingApp-WeeklyCleanup" -Action $Action3 -Trigger $Trigger3 -Settings $Settings3 -Description "Weekly backup cleanup" -Force

Write-Host "All backup tasks created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Created tasks:" -ForegroundColor Yellow
Write-Host "  - SchedulingApp-HourlyBackup - Runs every hour"
Write-Host "  - SchedulingApp-DailyMaintenance - Runs daily at 2 AM"
Write-Host "  - SchedulingApp-WeeklyCleanup - Runs Sundays at 3 AM"
Write-Host ""
Write-Host "To view tasks: Get-ScheduledTask | Where-Object {`$_.TaskName -like 'SchedulingApp*'}" -ForegroundColor Cyan
Write-Host "To remove tasks: Unregister-ScheduledTask -TaskName 'SchedulingApp-*' -Confirm:`$false" -ForegroundColor Cyan