import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';

interface Props {
  repositoryPath: string;
  repositoryBranch: string;
}

export class GithubOIDC extends Construct {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const ns = this.node.tryGetContext('ns') as string;

    const githubProvider = new iam.OpenIdConnectProvider(
      this,
      `${ns}GithubOIDC`,
      {
        url: 'https://token.actions.githubusercontent.com',
        clientIds: ['sts.amazonaws.com'],
        thumbprints: ['74f3a68f16524f15424927704c9506f55a9316bd'],
      },
    );
    const githubPrincipal = new iam.OpenIdConnectPrincipal(
      githubProvider,
    ).withConditions({
      StringLike: {
        'token.actions.githubusercontent.com:sub': `repo:${props.repositoryPath}:ref:refs/heads/${props.repositoryBranch}`,
      },
    });
    const role = new iam.Role(this, `${ns}GithubActionRole`, {
      assumedBy: githubPrincipal,
      roleName: `${ns}GithubActionRole`,
      description: 'Role for Github Actions',
    });
    role.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:ListBucket',
          'cloudfront:CreateInvalidation',
        ],
        resources: ['*'],
      }),
    );
  }
}
