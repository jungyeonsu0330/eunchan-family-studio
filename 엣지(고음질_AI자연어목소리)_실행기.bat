@echo off
chcp 65001 > nul
title 은찬이와 아빠의 모험 스튜디오 - 엣지 고품질 AI 음성 실행기
cls
echo ======================================================================
echo    은찬이와 아빠의 모험 스튜디오 (Microsoft Edge 고품질 AI 음성 실행기)
echo ======================================================================
echo.

:: 1. 로컬 파이썬 서버 확인 및 백그라운드 자동 실행
netstat -ano | findstr :8800 > nul
if %ERRORLEVEL% NEQ 0 (
    echo [1/2] 로컬 패밀리 서버(포트 8800)를 시작합니다...
    start "" /b python "C:\Users\Admin\Desktop\정은찬\server.py"
    timeout /t 2 > nul
) else (
    echo [1/2] 로컬 패밀리 서버가 이미 정상 작동 중입니다.
)

:: 2. 마이크로소프트 엣지 브라우저로 직통 연결 (인준/선희 AI 목소리 무료 지원)
echo [2/2] Microsoft Edge 브라우저를 엽니다...
set "TARGET_URL=http://localhost:8800/?pin=7979"
start "" msedge "%TARGET_URL%"

echo.
echo ======================================================================
echo   🌟 엣지 브라우저가 열렸습니다!
echo   🔊 이솝우화에서 다정한 아빠(인준)와 선생님(선희) 목소리를 들어보세요!
echo ======================================================================
timeout /t 2 > nul
exit
