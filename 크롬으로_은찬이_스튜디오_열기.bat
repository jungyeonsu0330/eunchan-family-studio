@echo off
chcp 65001 > nul
title 은찬이와 아빠의 모험 스튜디오 - 크롬 실행기
cls
echo ======================================================================
echo    은찬이와 아빠의 모험 스튜디오 (크롬 전용 빠른 실행기)
echo ======================================================================
echo.

:: 1. 로컬 파이썬 서버 확인 및 백그라운드 자동 실행
netstat -ano | findstr :8800 > nul
if %ERRORLEVEL% NEQ 0 (
    echo [1/2] 로컬 패밀리 서버(포트 8800)를 백그라운드에서 시작합니다...
    start "" /b python "%~dp0server.py"
    timeout /t 2 > nul
) else (
    echo [1/2] 로컬 패밀리 서버가 이미 정상 작동 중입니다.
)

:: 2. 구글 크롬으로 직통 연결
echo [2/2] 구글 크롬(Google Chrome) 브라우저를 엽니다...
set "TARGET_URL=http://localhost:8800/?pin=7979"

if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" "%TARGET_URL%"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" "%TARGET_URL%"
) else (
    start chrome "%TARGET_URL%"
)

echo.
echo ======================================================================
echo   🎉 크롬 브라우저가 열렸습니다! 신나게 공부를 시작해보세요!
echo ======================================================================
timeout /t 2 > nul
exit
