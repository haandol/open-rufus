import json

def lambda_handler():
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }