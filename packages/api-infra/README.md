# API Infra (packages/api-infra)

이 패키지는 `packages/app` 백엔드 애플리케이션의 AWS 인프라 (ECS, ALB, WAF, DynamoDB 등)를 정의하고 배포하는 역할을 합니다.

- **주요 기능:**
    - ECS 클러스터 및 서비스 정의
    - Application Load Balancer (ALB) 설정
    - WAF 웹 ACL 설정 (ALB 연동)
    - DynamoDB 테이블 생성
- **배포:** 관련 인프라 코드를 통해 배포합니다. (예: Terraform, CloudFormation, CDK 등)