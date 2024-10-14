export interface ISqsService {
  sendMessage(queueName: string, data: any): Promise<string>;
}
