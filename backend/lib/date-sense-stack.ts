import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export class DateSenseStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 버킷
    const s3Bucket = new s3.Bucket(this, 'DateSenseBucket', {
      bucketName: 'date-sense',
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: ['*'],
          exposedHeaders: ['ETag'],
          maxAge: 3000,
        },
      ],
    });

    // DynamoDB 테이블들
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'Users',
      partitionKey: { name: 'user_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Users 테이블에 email로 조회할 수 있는 GSI 추가
    usersTable.addGlobalSecondaryIndex({
      indexName: 'EmailIndex',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const profilesTable = new dynamodb.Table(this, 'ProfilesTable', {
      tableName: 'Profiles',
      partitionKey: { name: 'user_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const userPreferencesTable = new dynamodb.Table(this, 'UserPreferencesTable', {
      tableName: 'UserPreferences',
      partitionKey: { name: 'user_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const matchingRequestsTable = new dynamodb.Table(this, 'MatchingRequestsTable', {
      tableName: 'MatchingRequests',
      partitionKey: { name: 'request_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const pointsHistoryTable = new dynamodb.Table(this, 'PointsHistoryTable', {
      tableName: 'PointsHistory',
      partitionKey: { name: 'user_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'DateSenseUserPool', {
      userPoolName: 'DateSenseUserPool',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        name: {
          required: true,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const userPoolClient = new userPool.addClient('DateSenseUserPoolClient', {
      userPoolClientName: 'DateSenseUserPoolClient',
      generateSecret: false,
      authFlows: {
        adminUserPassword: true,
        userPassword: true,
        userSrp: true,
      },
    });

    // 공통 Lambda 환경 변수
    const commonEnvironment = {
      S3_BUCKET_NAME: s3Bucket.bucketName,
      S3_REGION: this.region,
      USER_POOL_ID: userPool.userPoolId,
      USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
    };

    // 공통 Lambda 실행 역할
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // DynamoDB 권한 추가
    usersTable.grantReadWriteData(lambdaRole);
    profilesTable.grantReadWriteData(lambdaRole);
    userPreferencesTable.grantReadWriteData(lambdaRole);
    matchingRequestsTable.grantReadWriteData(lambdaRole);
    pointsHistoryTable.grantReadWriteData(lambdaRole);

    // S3 권한 추가
    s3Bucket.grantReadWrite(lambdaRole);

    // Lambda 함수들 생성
    const signupFunction = new lambda.Function(this, 'SignupFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'signup.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: commonEnvironment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
    });

    const loginFunction = new lambda.Function(this, 'LoginFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'login.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: commonEnvironment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    const saveProfileFunction = new lambda.Function(this, 'SaveProfileFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'saveProfile.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: commonEnvironment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
    });

    const getProfileFunction = new lambda.Function(this, 'GetProfileFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'getProfile.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: commonEnvironment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
    });

    const saveUserPreferencesFunction = new lambda.Function(this, 'SaveUserPreferencesFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'saveUserPreferences.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: commonEnvironment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
    });

    const getUserPreferencesFunction = new lambda.Function(this, 'GetUserPreferencesFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'getUserPreferences.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: commonEnvironment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
    });

    const requestMatchingFunction = new lambda.Function(this, 'RequestMatchingFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'requestMatching.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: commonEnvironment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
    });

    const getMatchingRequestsFunction = new lambda.Function(this, 'GetMatchingRequestsFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'getMatchingRequests.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: commonEnvironment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
    });

    const getCardsFunction = new lambda.Function(this, 'GetCardsFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'getCards.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: commonEnvironment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
    });

    const getMainCardFunction = new lambda.Function(this, 'GetMainCardFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'getMainCard.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: commonEnvironment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
    });

    const uploadImageFunction = new lambda.Function(this, 'UploadImageFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'uploadImage.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: commonEnvironment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    const getUploadUrlFunction = new lambda.Function(this, 'GetUploadUrlFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'getUploadUrl.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: commonEnvironment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
    });

    const getTermsFunction = new lambda.Function(this, 'GetTermsFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'getTerms.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: commonEnvironment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
    });

    const getPrivacyFunction = new lambda.Function(this, 'GetPrivacyFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'getPrivacy.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: commonEnvironment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
    });

    const getCustomerServiceFunction = new lambda.Function(this, 'GetCustomerServiceFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'getCustomerService.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: commonEnvironment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'DateSenseApi', {
      restApiName: 'DateSense API',
      description: 'DateSense API Gateway',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token'],
      },
    });

    // API 리소스 및 메서드 생성
    const signup = api.root.addResource('signup');
    signup.addMethod('POST', new apigateway.LambdaIntegration(signupFunction));

    const login = api.root.addResource('login');
    login.addMethod('POST', new apigateway.LambdaIntegration(loginFunction));

    const profile = api.root.addResource('profile');
    profile.addMethod('POST', new apigateway.LambdaIntegration(saveProfileFunction));
    
    const profileWithId = profile.addResource('{userId}');
    profileWithId.addMethod('GET', new apigateway.LambdaIntegration(getProfileFunction));

    const userPreferences = api.root.addResource('user-preferences');
    userPreferences.addMethod('POST', new apigateway.LambdaIntegration(saveUserPreferencesFunction));
    
    const userPreferencesWithId = userPreferences.addResource('{userId}');
    userPreferencesWithId.addMethod('GET', new apigateway.LambdaIntegration(getUserPreferencesFunction));

    const matchingRequests = api.root.addResource('matching-requests');
    matchingRequests.addMethod('POST', new apigateway.LambdaIntegration(requestMatchingFunction));
    matchingRequests.addMethod('GET', new apigateway.LambdaIntegration(getMatchingRequestsFunction));

    const cards = api.root.addResource('cards');
    cards.addMethod('GET', new apigateway.LambdaIntegration(getCardsFunction));

    const mainCard = api.root.addResource('main-card');
    mainCard.addMethod('GET', new apigateway.LambdaIntegration(getMainCardFunction));

    const uploadImage = api.root.addResource('upload-image');
    uploadImage.addMethod('POST', new apigateway.LambdaIntegration(uploadImageFunction));

    const getUploadUrl = api.root.addResource('get-upload-url');
    getUploadUrl.addMethod('POST', new apigateway.LambdaIntegration(getUploadUrlFunction));

    const terms = api.root.addResource('terms');
    terms.addMethod('GET', new apigateway.LambdaIntegration(getTermsFunction));

    const privacy = api.root.addResource('privacy');
    privacy.addMethod('GET', new apigateway.LambdaIntegration(getPrivacyFunction));

    const customerService = api.root.addResource('customer-service');
    customerService.addMethod('GET', new apigateway.LambdaIntegration(getCustomerServiceFunction));

    // 출력값들
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'S3 Bucket Name',
    });
  }
} 