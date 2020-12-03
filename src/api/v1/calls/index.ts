import express from "express";
import { IMessageHandler } from "../../../messageHandler";
import { IMessage } from "../../../models/message";
import { IRealm } from "../../../models/realm";
import { clog } from "../../../utils";

export default ({
  realm,
  messageHandler,
}: {
  realm: IRealm;
  messageHandler: IMessageHandler;
}): express.Router => {
  const app = express.Router();

  const handle = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): any => {
    clog("Handle getting executed: " + (new Date()).toISOString());
    const { id } = req.params;

    console.log("Got request...");

    if (!id) return next();

    const client = realm.getClientById(id);

    if (!client) {
      throw new Error(`client not found:${id}`);
    }

    const { type, dst, payload } = req.body;

    const message: IMessage = {
      type,
      src: id,
      dst,
      payload,
    };

    messageHandler.handle(client, message);

    clog("Handle executed: " + (new Date()).toISOString());
    res.sendStatus(200);
  };

  app.post("/offer", handle);
  app.post("/candidate", handle);
  app.post("/answer", handle);
  app.post("/leave", handle);

  return app;
};
