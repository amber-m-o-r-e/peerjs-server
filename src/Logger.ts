const Redis = require("ioredis");
let instance: any = null;
class Logger {
  private readonly redis: any;
  constructor(redisHost: string | undefined, redisPort: number | undefined) {
    if (!instance) {
      this.redis = new Redis(redisPort, redisHost);
      instance = this;
    } else {
      return instance;
    }
  }

  public logById(meetingId: string, message: string): void {
    this.redis.get(meetingId, (err: Error, results: string) => {
      if (err) {
        console.log(err);
        return;
      }
      let tempResult = JSON.parse(results);
      if (tempResult) {
        tempResult = [...tempResult, message];
      } else {
        tempResult = [message];
      }
      this.redis.set(meetingId, JSON.stringify(tempResult));
      console.log(tempResult);
    });
  }

  public async getById(meetingId: string): Promise<Array<string>> {
    const results = await this.redis.get(meetingId);
    return JSON.parse(results);
  }
}

export default Logger;
