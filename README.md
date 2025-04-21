# Open Rufus Demo

Open Rufus Demo 는 실시간 스트리밍 채팅 기능과 상품 검색 및 추천을 제공하는 웹 애플리케이션 데모입니다.
시맨틱 캐싱, 프롬프트 캐싱 등의 프로덕션에 필요한 필수 기능들을 체험할 수 있습니다.
AWS 클라우드 서비스를 기반으로 구축되었으며, 컨테이너 기반의 서비스로 챗봇을 구성할 경우 참고할 수 있는 아키텍처를 제공합니다.

서버리스 아키텍쳐의 챗봇을 구성할 경우에는 [Bedrock Chat](https://github.com/aws-samples/bedrock-chat) 프로젝트를 참고하세요.

## Architecture

Open Rufus Demo의 전체 시스템 아키텍처는 다음과 같습니다.

![OpenRufus Architecture](/docs/architecture.png)

- **Frontend:** Nuxt.js 기반의 정적 웹 페이지(`web`)가 S3에 저장되고 CloudFront를 통해 배포됩니다. CloudFront 앞단에는 WAF가 적용되어 보안을 강화합니다. 사용자 인증은 Cognito UserPool을 사용합니다.
- **Chatbot Backend:** FastAPI로 구현된 실시간 스트리밍 서버(`app`)는 ECS 클러스터에서 실행됩니다. ALB를 통해 로드 밸런싱되며, WAF가 적용되어 있습니다. CloudFront를 통해서만 접근 가능하도록 제한됩니다. 채팅 데이터는 DynamoDB에 저장되고, Bedrock Converse API를 활용하여 지능적인 응답 생성을 지원합니다.
- **Item & Knowledge Search APIs:** `api-infra` 패키지에 정의된 서버리스 API로 구현되어, API_KEY 방식으로 호출됩니다. API Gateway, Lambda Authorizer, Lambda 함수, 그리고 OpenSearch 인덱스를 사용합니다. 내부 검색 API는 임베딩을 위해 Amazon Titan Text Embeddings V2 model 모델을 사용하고 있습니다.
  - **Item Search API:** 상품 검색을 위한 기능입니다. Nori 토크나이저를 통해 한글 정보를 토큰화하고, 토큰화된 정보를 OpenSearch 를 통해 일반적인 full-text 키워드 검색을 수행합니다.
  - **Knowledge Search API:** RAG 기반의 내부 정보에 대한 질문/답변을 하는 기능입니다. 데이터 추가를 위해서는 지정된 버킷에 데이터를 업로드하면 람다 함수를 통해 인덱싱됩니다.

## Project Structure

Nx 워크스페이스는 여러 패키지로 구성됩니다:

- `packages/web`: Nuxt.js 기반의 프론트엔드 웹 애플리케이션.
- `packages/web-infra`: GitHub Actions를 사용한 `web` 패키지의 CloudFront 배포 인프라 코드.
- `packages/app`: FastAPI 기반의 백엔드 스트리밍 서버.
- `packages/api-infra`: ECS 클러스터, WAF 등을 포함한 `app` 패키지의 배포 인프라 코드.

각 패키지의 사용방법은 패키지 내의 README.md 파일을 참고하세요.

## Deployment

- 배포는 각 인프라 패키지(`web-infra`, `api-infra`)에 정의된 절차를 따릅니다.
- `web-infra`는 GitHub Actions를 통해 자동화될 수 있습니다.
