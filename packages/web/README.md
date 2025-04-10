# Web Frontend (packages/web)

이 패키지는 OpenRufus 프로젝트의 프론트엔드 웹 애플리케이션입니다.

- **프레임워크:** Nuxt.js (SSG 모드)
- **주요 기능:**
    - 실시간 채팅 인터페이스
    - 상품 검색 및 추천 결과 표시
- **배포:** AWS S3에 정적 파일로 빌드되어 CloudFront를 통해 제공됩니다.

## 개발 서버 실행

```sh
npx nx serve web
```

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
