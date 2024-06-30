/* eslint-disable @typescript-eslint/naming-convention */
import { DependencyContainer } from "tsyringe";
import { IPostAkiLoadMod } from "@spt-aki/models/external/IPostAkiLoadMod";
import { enable } from "../config/config.json";
import GlobalChanges from "./Changers/GlobalChanges";

class QuestDifficultyTweaker implements IPostAkiLoadMod {
  postAkiLoad(container: DependencyContainer): void {
    if (enable) GlobalChanges(container);
  }
}

module.exports = { mod: new QuestDifficultyTweaker() };
