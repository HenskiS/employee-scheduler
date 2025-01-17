@echo off
setlocal EnableDelayedExpansion

rem Load environment variables from .env file
for /f "tokens=1,* delims==" %%a in ('type .env ^| findstr /v "^#"') do (
    set "%%a=%%b"
)

echo Building React application...
call npm run build

echo Copying build files to server...
scp -r ./build/* root@%SERVER_IP%:%CLIENT_PATH%/build

echo Setting permissions...
ssh root@%SERVER_IP% "chown -R www-data:www-data %CLIENT_PATH%/build"

echo Deployment completed!
pause