# Open Rufus Demo

Open Rufus Demo 는 실시간 스트리밍 채팅 기능과 상품 검색 및 추천을 제공하는 웹 애플리케이션 데모입니다.
시맨틱 캐싱, 프롬프트 캐싱 등의 프로덕션에 필요한 필수 기능들을 체험할 수 있습니다.
AWS 클라우드 서비스를 기반으로 구축되었으며, 컨테이너 기반의 서비스로 챗봇을 구성할 경우 참고할 수 있는 아키텍처를 제공합니다.

서버리스 아키텍쳐의 챗봇을 구성할 경우에는 [Bedrock Chat](https://github.com/aws-samples/bedrock-chat) 프로젝트를 참고하세요.

## Architecture

Open Rufus Demo의 전체 시스템 아키텍처는 다음과 같습니다.

![OpenRufus Architecture](/docs/architecture.png)

*   **Frontend:** Nuxt.js 기반의 정적 웹 페이지(`web`)가 S3에 저장되고 CloudFront를 통해 배포됩니다. CloudFront 앞단에는 WAF가 적용되어 보안을 강화합니다. 사용자 인증은 Cognito UserPool을 사용합니다.
*   **Chatbot Backend:** FastAPI로 구현된 실시간 스트리밍 서버(`app`)는 ECS 클러스터에서 실행됩니다. ALB를 통해 로드 밸런싱되며, WAF가 적용되어 있습니다. CloudFront를 통해서만 접근 가능하도록 제한됩니다. 채팅 데이터는 DynamoDB에 저장되고, Bedrock Converse API를 활용하여 지능적인 응답 생성을 지원합니다.
*   **Search & Recommendation APIs:** (현재 계획되지 않음) 상품 검색 및 추천 기능은 향후 별도의 서버리스 API로 구현될 수 있습니다. API Gateway, Lambda Authorizer, Lambda 함수, 그리고 OpenSearch 인덱스를 사용할 수 있습니다. 추천 API는 추가적으로 Bedrock Embedding 모델을 활용할 수 있습니다.

## Project Structure

Nx 워크스페이스는 여러 패키지로 구성됩니다:

*   `packages/web`: Nuxt.js 기반의 프론트엔드 웹 애플리케이션.
*   `packages/web-infra`: GitHub Actions를 사용한 `web` 패키지의 CloudFront 배포 인프라 코드.
*   `packages/app`: FastAPI 기반의 백엔드 스트리밍 서버.
*   `packages/api-infra`: ECS 클러스터, WAF 등을 포함한 `app` 패키지의 배포 인프라 코드.

## Deployment

배포는 각 인프라 패키지(`web-infra`, `api-infra`)에 정의된 절차를 따릅니다. `web-infra`는 GitHub Actions를 통해 자동화될 수 있습니다.
