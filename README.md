# ChiChiFolio

개인 자산관리 대시보드 · 미국·한국 주식, 실시간 환율, 배당금 분석

## 환경 변수 (배포)

GitLab **Settings → CI/CD → Variables** 에서 다음 변수를 설정하면 빌드 시 적용됩니다.

| 변수명 | 설명 |
|--------|------|
| `FINNHUB_KEY` | Finnhub API 키 (주가/검색) |
| `FMP_API_KEY` | FMP API 키 (검색 품질 향상, **필수**: 설정 시 FMP 검색 사용) |
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `ADMIN_PASSWORD` | 관리자 비밀번호 |

`FMP_API_KEY`를 설정하면 종목 검색 시 FMP search-symbol/search-name API가 함께 사용되어 검색 품질이 향상됩니다.
