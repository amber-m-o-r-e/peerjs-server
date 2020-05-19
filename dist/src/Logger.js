"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Redis = require("ioredis");
let instance = null;
class Logger {
    constructor(redisHost, redisPort) {
        if (!instance) {
            this.redis = new Redis(redisPort, redisHost);
            instance = this;
        }
        else {
            return instance;
        }
    }
    logById(meetingId, message) {
        this.redis.get(meetingId, (err, results) => {
            if (err) {
                console.log(err);
                return;
            }
            let tempResult = JSON.parse(results);
            if (tempResult) {
                tempResult = [...tempResult, message];
            }
            else {
                tempResult = [message];
            }
            this.redis.set(meetingId, JSON.stringify(tempResult));
            console.log(tempResult);
        });
    }
    getById(meetingId) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = yield this.redis.get(meetingId);
            return JSON.parse(results);
        });
    }
}
exports.default = Logger;
