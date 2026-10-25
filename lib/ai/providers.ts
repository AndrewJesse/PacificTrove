import { customProvider, gateway } from "ai";
import { isTestEnvironment } from "../constants";
import { FRONTIER_MODEL_ID } from "./models";

function frontierModelId() {
  return process.env.FRONTIER_MODEL || FRONTIER_MODEL_ID;
}

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        chatModel,
        titleModel: mockTitleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "title-model": mockTitleModel,
        },
      });
    })()
  : null;

export function getLanguageModel(modelId: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(modelId);
  }

  return gateway.languageModel(frontierModelId());
}

export function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }
  return gateway.languageModel(frontierModelId());
}
