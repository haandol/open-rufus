# Web Infra (`packages/web-infra`)

이 패키지는 `packages/web` 프론트엔드 애플리케이션을 위한 AWS 인프라를 AWS CDK (Cloud Development Kit)를 사용하여 정의하고 배포합니다.

## 주요 구성 요소

-   **S3 Bucket:** 정적 웹사이트 파일을 저장하는 비공개 S3 버킷을 생성합니다.
-   **CloudFront Distribution:** S3 버킷의 콘텐츠를 제공하고, API 요청을 프록시하며, 커스텀 헤더 인증 및 WAF 보호를 적용하는 CloudFront 배포를 설정합니다. (`${ns}Cloudfront`)
-   **WAF WebACL:** 특정 IP 주소만 접근을 허용하는 규칙을 포함하는 Web ACL을 생성하여 CloudFront 배포를 보호합니다.
-   **GitHub OIDC Provider:** GitHub Actions 워크플로우가 AWS 리소스에 안전하게 접근하여 배포할 수 있도록 IAM OIDC 자격 증명 공급자를 설정합니다.

## 아키텍처

```
GitHub Actions --> GitHub OIDC --> AWS IAM Role --> Deploy (CDK)
       |                                              |
       +--------------------------------------------> S3 (Static Files)
                                                        |
User <-- CloudFront (+ WAF IP Allowlist, Custom Header) <--+
       |                                                  |
       +--------------------------------------------> API Gateway (External)
```

## 설정

-   **설정:** 프로젝트 설정은 `config/` 디렉토리 내 설정 파일 (`default.toml`, `development.toml`, `production.toml` 등) 을 통해 관리됩니다. `config/loader.ts`가 `.toml` 파일을 통해 설정을 로드합니다. 주요 설정값은 `bin/infra.ts`를 통해 스택에 전달됩니다.
    -   `ns`: 리소스 이름 앞에 붙는 네임스페이스 (CDK Context)
    -   `stage`: 배포 환경 (development, production 등) (CDK Context)
    -   `apiUri`: 프록시할 API 엔드포인트 URI
    -   `repositoryPath`: GitHub OIDC에서 사용할 레포지토리 경로 (e.g., `my-org/my-repo`)
    -   `repositoryBranch`: GitHub OIDC에서 사용할 브랜치
    -   `secretHeaderName`/`secretHeaderValue`: CloudFront와 오리진(ECS 에서 사용하는 Application Load Balancer) 간의 인증을 위한 커스텀 헤더
    -   `allowIpList`: WAF에서 허용할 IP 주소 목록


## 배포

의존성 설치

```bash
yarn install
```

설정 파일 복사

```bash
cp config/dev.toml .toml
```

설정 파일에서 아래의 내용을 수정합니다.
```toml
[api]
uri = "API_URL" # 프록시할 Application Load Balancer 엔드포인트 URI, e.g. example.com (https scheme 제외)

[cloudfront]
secretHeaderName = "x-cloudfront-secret-key" # Application Load Balancer 로 전달할 커스텀 헤더 이름 (api-infra 와 동일해야 함)
secretHeaderValue = "YOUR_SECRET_VALUE" # Application Load Balancer 로 전달할 커스텀 헤더 값 (api-infra 와 동일해야 함)
allowIpList = ["127.0.0.1/32"] # WAF에서 허용할 IP 주소 목록

[repository]
path = "haandol/open-rufus" # Github OIDC 에서 사용할 레포지토리 경로
branch = "main" # Github OIDC 에서 사용할 브랜치
```

배포

```bash
cdk bootstrap
cdk deploy "*" --concurrency 3 --profile <aws-profile>
```
