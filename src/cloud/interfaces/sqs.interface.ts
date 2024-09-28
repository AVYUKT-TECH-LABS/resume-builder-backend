export interface ISqsService {
  sendMessage(
    queueName: string,
    data: {
      to: string;
      subject: string;
      body: string;
    },
  ): Promise<string>;
}
