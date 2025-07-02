import { SSTConfig } from "sst";
import { API } from "./stacks/API";
import { Database } from "./stacks/Database";
import { Storage } from "./stacks/Storage";
import { Auth } from "./stacks/Auth";

export default {
  config(_input) {
    return {
      name: "couple-maker",
      region: "ap-northeast-2", // 서울 리전
    };
  },
  stacks(app) {
    app
      .stack(Database)
      .stack(Storage)
      .stack(Auth)
      .stack(API);
  },
} satisfies SSTConfig; 