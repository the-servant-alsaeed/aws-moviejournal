export const lambdaFunctions = {
    sendWelcomeEmail: `workshop-qasim-${process.env.STAGE}-sendWelcomeEmail`
}

export function getQueueUrlByArn(accountId: string, queueArn: string) {
    const regex = new RegExp(`${accountId}:`);
    const queueName = queueArn.split(regex)[1];
    return `https://sqs.${process.env.AWS_REGION}.amazonaws.com/${accountId}/${queueName}`;
}
