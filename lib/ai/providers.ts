import { customProvider, gateway } from "ai";
import { isTestEnvironment } from "../constants";
import { AUTO_TARGET_ID, resolveModelId } from "./models";

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
    return myProvider.languageModel(
      modelId === "title-model" ? "title-model" : "chat-model"
    );
  }

  return gateway.languageModel(resolveModelId(modelId));
}

export function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }
  return gateway.languageModel(AUTO_TARGET_ID);
}
