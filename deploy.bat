@echo off
chcp 65001 >nul
color 0E
title DubAIVal — Deploy

echo.
echo ============================================================
echo   DubAIVal — AI Property Intelligence Platform
echo   Live: https://www.dubaival.com
echo ============================================================
echo.
echo   TOOLS ON PLATFORM:
echo.
echo   [HOME PAGE]
echo   1.  Analyzer          — Full property valuation (sale + rent)
echo   2.  Quick Check       — Rapid area-level valuation
echo   3.  Market Pulse      — Live market dashboard
echo   4.  Market Moments    — Market news + alerts
echo   5.  Off-Market Deal   — Blind private exchange (OFM)
echo.
echo   [MARKET]
echo   6.  Track Record      — Estimate vs actual case studies
echo   7.  Market Index      — Area rankings + heatmaps
echo   8.  Compare           — Side-by-side area comparison
echo   9.  Smart Find        — AI property discovery (8,522+ buildings)
echo   10. Interactive Map   — Leaflet map with 6 metric overlays
echo   11. Personal Advisor  — AI questionnaire + area recommendations
echo   12. Mortgage Calc     — Full mortgage + DLD fee calculator
echo.
echo   [PORTFOLIO]
echo   13. My Assets         — Asset tracking + real-time valuations
echo   14. Health Score      — Portfolio health + diversification
echo   15. Projections       — Future simulator + what-if swap
echo   16. Price Alerts      — Deal alert subscriptions
echo.
echo   [NETWORK]
echo   17. OFM Deal Board    — Post listings / post requirements
echo   18. Agent Hub         — Agent directory + referral program
echo   19. AI Agents         — 8 specialized AI assistants
echo   20. Social Media Mgr  — Content creation + scheduling + video
echo   21. PropTech Video    — Agent video listings platform
echo   22. AI Chief of Staff — Inventory + client CRM + auto-matching
echo   23. Inbox             — Unified email + Instagram + Facebook
echo.
echo   [MORE]
echo   24. Workspace         — Custom dashboard builder (14+ widgets)
echo   25. Report Builder    — PDF export with branding
echo   26. Admin Panel       — Market controls + diagnostics
echo   27. About             — Mission + API docs
echo.
echo   DATABASE: 8,522 residential + 1,930 commercial + 428 land
echo             10,880 total properties across 347 areas
echo.
echo ============================================================
echo.

set /p CONFIRM=Deploy to production? (Y/N):
if /i not "%CONFIRM%"=="Y" (
  echo Cancelled.
  pause
  exit /b
)

echo.
echo [1/2] Pulling latest from branch...
git pull origin claude/dubaival-portfolio-manager-5bgbjk
if errorlevel 1 (
  echo ERROR: git pull failed.
  pause
  exit /b 1
)

echo.
echo [2/2] Deploying to Vercel production...
npx vercel --prod
if errorlevel 1 (
  echo ERROR: Vercel deploy failed.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo   DEPLOY COMPLETE — https://www.dubaival.com
echo ============================================================
echo.
pause
