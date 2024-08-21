import { SQSEvent } from "aws-lambda";

export default async (event: SQSEvent) => {
  const records = event.Records;
  for (const record of records) {
    console.log(JSON.stringify(record));
    // const body = JSON.parse(record.body);
    
  }
}