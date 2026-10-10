@echo off
chcp 65001 > nul
title 은찬이와 아빠의 4개국어 & 역사 모험 스튜디오

echo ========================================================
echo   은찬이와 아빠의 4개국어 & 역사 모험 스튜디오를 시작합니다!
echo ========================================================
echo.

where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    python server.py
) else (
    where py >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        py server.py
    ) else (
        echo [오류] Python이 설치되어 있지 않거나 환경변수 PATH에 등록되지 않았습니다.
        pause
    )
)
pause
