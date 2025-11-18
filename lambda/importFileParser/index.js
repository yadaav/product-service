"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const aws_sdk_1 = require("aws-sdk");
const csv_parser_1 = __importDefault(require("csv-parser"));
const s3_1 = __importDefault(require("aws-sdk/clients/s3"));
const sqs = new aws_sdk_1.SQS();
const s3 = new s3_1.default();
const handler = async (event) => {
    for (const record of event.Records) {
        const bucket = record.s3.bucket.name;
        const key = record.s3.object.key;
        const queueUrl = process.env.SQS_URL;
        const s3Stream = s3.getObject({ Bucket: bucket, Key: key }).createReadStream();
        await new Promise((resolve, reject) => {
            const sendPromises = [];
            s3Stream
                .pipe((0, csv_parser_1.default)())
                .on("data", (row) => {
                // No logging here
                sendPromises.push(sqs
                    .sendMessage({
                    QueueUrl: queueUrl,
                    MessageBody: JSON.stringify(row),
                })
                    .promise());
            })
                .on("end", async () => {
                await Promise.all(sendPromises);
                resolve(undefined);
            })
                .on("error", reject);
        });
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSxxQ0FBOEI7QUFDOUIsNERBQTZCO0FBQzdCLDREQUFvQztBQUVwQyxNQUFNLEdBQUcsR0FBRyxJQUFJLGFBQUcsRUFBRSxDQUFDO0FBQ3RCLE1BQU0sRUFBRSxHQUFHLElBQUksWUFBRSxFQUFFLENBQUM7QUFFYixNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsS0FBYyxFQUFFLEVBQUU7SUFDOUMsS0FBSyxNQUFNLE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDbkMsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ3JDLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQztRQUNqQyxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQVEsQ0FBQztRQUV0QyxNQUFNLFFBQVEsR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBRS9FLE1BQU0sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDcEMsTUFBTSxZQUFZLEdBQW1CLEVBQUUsQ0FBQztZQUN4QyxRQUFRO2lCQUNMLElBQUksQ0FBQyxJQUFBLG9CQUFHLEdBQUUsQ0FBQztpQkFDWCxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUU7Z0JBQ2xCLGtCQUFrQjtnQkFDbEIsWUFBWSxDQUFDLElBQUksQ0FDZixHQUFHO3FCQUNBLFdBQVcsQ0FBQztvQkFDWCxRQUFRLEVBQUUsUUFBUTtvQkFDbEIsV0FBVyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDO2lCQUNqQyxDQUFDO3FCQUNELE9BQU8sRUFBRSxDQUNiLENBQUM7WUFDSixDQUFDLENBQUM7aUJBQ0QsRUFBRSxDQUFDLEtBQUssRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDcEIsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUNoQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDckIsQ0FBQyxDQUFDO2lCQUNELEVBQUUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDekIsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0FBQ0gsQ0FBQyxDQUFDO0FBOUJXLFFBQUEsT0FBTyxXQThCbEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTM0V2ZW50IH0gZnJvbSBcImF3cy1sYW1iZGFcIjtcbmltcG9ydCB7IFNRUyB9IGZyb20gXCJhd3Mtc2RrXCI7XG5pbXBvcnQgY3N2IGZyb20gXCJjc3YtcGFyc2VyXCI7XG5pbXBvcnQgUzMgZnJvbSBcImF3cy1zZGsvY2xpZW50cy9zM1wiO1xuXG5jb25zdCBzcXMgPSBuZXcgU1FTKCk7XG5jb25zdCBzMyA9IG5ldyBTMygpO1xuXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChldmVudDogUzNFdmVudCkgPT4ge1xuICBmb3IgKGNvbnN0IHJlY29yZCBvZiBldmVudC5SZWNvcmRzKSB7XG4gICAgY29uc3QgYnVja2V0ID0gcmVjb3JkLnMzLmJ1Y2tldC5uYW1lO1xuICAgIGNvbnN0IGtleSA9IHJlY29yZC5zMy5vYmplY3Qua2V5O1xuICAgIGNvbnN0IHF1ZXVlVXJsID0gcHJvY2Vzcy5lbnYuU1FTX1VSTCE7XG5cbiAgICBjb25zdCBzM1N0cmVhbSA9IHMzLmdldE9iamVjdCh7IEJ1Y2tldDogYnVja2V0LCBLZXk6IGtleSB9KS5jcmVhdGVSZWFkU3RyZWFtKCk7XG5cbiAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCBzZW5kUHJvbWlzZXM6IFByb21pc2U8YW55PltdID0gW107XG4gICAgICBzM1N0cmVhbVxuICAgICAgICAucGlwZShjc3YoKSlcbiAgICAgICAgLm9uKFwiZGF0YVwiLCAocm93KSA9PiB7XG4gICAgICAgICAgLy8gTm8gbG9nZ2luZyBoZXJlXG4gICAgICAgICAgc2VuZFByb21pc2VzLnB1c2goXG4gICAgICAgICAgICBzcXNcbiAgICAgICAgICAgICAgLnNlbmRNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICBRdWV1ZVVybDogcXVldWVVcmwsXG4gICAgICAgICAgICAgICAgTWVzc2FnZUJvZHk6IEpTT04uc3RyaW5naWZ5KHJvdyksXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5wcm9taXNlKClcbiAgICAgICAgICApO1xuICAgICAgICB9KVxuICAgICAgICAub24oXCJlbmRcIiwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGF3YWl0IFByb21pc2UuYWxsKHNlbmRQcm9taXNlcyk7XG4gICAgICAgICAgcmVzb2x2ZSh1bmRlZmluZWQpO1xuICAgICAgICB9KVxuICAgICAgICAub24oXCJlcnJvclwiLCByZWplY3QpO1xuICAgIH0pO1xuICB9XG59O1xuIl19