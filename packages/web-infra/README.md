# Web Infra (packages/web-infra)

이 패키지는 `packages/web` 프론트엔드 애플리케이션의 AWS 인프라 (CloudFront, S3, WAF 등)를 정의하고 배포하는 역할을 합니다.

- **주요 기능:**
    - CloudFront 배포 설정
    - S3 버킷 생성 및 웹사이트 호스팅 설정
    - WAF 웹 ACL 설정
- **배포:** GitHub Actions 워크플로우를 통해 관리될 수 있습니다. (구체적인 배포 스크립트는 여기에 추가될 수 있습니다.)