import { SQSEvent } from "aws-lambda";

export default async (event: SQSEvent) => {
  const records = event.Records;
  console.log(records);
  // return "We sent you an email!\n" + "Please check your inbox.";
  // for (const record of records) {
  //   console.log(JSON.stringify(record));
  //   // const body = JSON.parse(record.body);
  //
  // }
}
