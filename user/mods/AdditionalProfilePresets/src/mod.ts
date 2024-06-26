import 	{ DependencyContainer } from "tsyringe";

import 	{ IPostDBLoadMod } 		from "@spt-aki/models/external/IPostDBLoadMod";

import 	{ DatabaseServer }		from "@spt-aki/servers/DatabaseServer";
import 	{ ICoreDatabase }  		from "@spt-aki/atlas/ICoreDatabase";
import 	{ IDatabaseTables }		from "@spt-aki/models/spt/server/IDatabaseTables";
import 	{ ILogger } 			from "@spt-aki/models/spt/utils/ILogger";

import 	{ PreAkiModLoader }		from "@spt-aki/loaders/PreAkiModLoader";

import 	{ ImporterUtil }   		from "@spt-aki/utils/ImporterUtil";
import 	{ JsonUtil }       		from "@spt-aki/utils/JsonUtil"

import 	{ readFileSync } 		from "fs";
import 	{ join } 				from "path";

import config from "../config/config.json";

//Pull in config

class Mod implements IPostDBLoadMod {
	
    logger: ILogger
	
	private db:         IDatabaseTables;
    private mydb:       ICoreDatabase;
    private logger:     ILogger;
    private jsonUtil:   JsonUtil;

    public postDBLoad(container: DependencyContainer): void {
	
		this.logger 			= 	container.resolve<ILogger>("WinstonLogger");
		this.jsonUtil 			=  	container.resolve<JsonUtil>("JsonUtil");

        const databaseServer 	=  	container.resolve<DatabaseServer>("DatabaseServer");
        const databaseImporter 	=  	container.resolve<ImporterUtil>("ImporterUtil");
        const modLoader 		=  	container.resolve<PreAkiModLoader>("PreAkiModLoader");
		
		const modFolderName 	= 	"AdditionalProfilePresets";
		
		this.db 				= 	databaseServer.getTables();
		this.mydb 				= 	databaseImporter.loadRecursive(`${modLoader.getModPath(modFolderName)}database/`);
		
		this.addPockets();
		
		if (config.EnableStandardEdition) 
		{
			this.createPreset(
				"Zero To Hero - Standard", 
				"Standard-HC", 
				"Start with NOTHING except only a basic stash size (10x28), a bayonet 6Kh5/ER, and an Alpha secure container", 
				"Старт без прокачки чего-либо, снаряжение: штык-нож 6х5/ER, подсумок Alpha)", 
				"Standard", 
				"./preset_info/standard_bear.json", 
				"./preset_info/standard_usec.json"
			);
		}
		if (config.EnablePTEEdition) 
		{
			this.createPreset(
				"Zero To Hero - Prepare To Escape", 
				"PtE-HC", 
				"Start with NOTHING except only a large stash size (10x48), a Voodoo tomahawk, and a Beta secure container", 
				"Старт без прокачки чего-либо, снаряжение: томагавк Voodoo, подсумок Beta", 
				"Prepare To Escape", 
				"./preset_info/pte.json", 
				"./preset_info/pte.json"
			);
		}
		if (config.EnableEODEdition) 
		{
			this.createPreset(
				"Zero To Hero - Edge Of Darkness", 
				"EoD-HC", 
				"Start with NOTHING except only a huge stash size (10x68), a Kiba tomahawk, an Alpha armband, and a Gamma secure container", 
				"Старт без прокачки чего-либо, снаряжение: томагавк Kiba, повязка Альфа, подсумок Gamma", 
				"Edge Of Darkness", 
				"./preset_info/eod.json", 
				"./preset_info/eod.json"
			);
		}
		if (config.EnableUnheardEdition) 
		{
			if (config.UseUnheardItemsPreview) {
				this.createPreset(
					"Zero To Hero - The Unheard", 
					"TUE-HC", 
					"Start without any advancements, starting gear: Kukri, Unheard armband, TUE pockets, Gamma secure container", 
					"Старт без прокачки чего-либо, снаряжение: кукри, повязка Unheard, увеличенные карманы из TUE, подсумок Gamma", 
					"Edge Of Darkness", 
					"./preset_info/tue.json", 
					"./preset_info/tue.json"
				);
			}
			else
			{
				this.createPreset(
					"Zero To Hero - The Unheard", 
					"TUE-HC", 
					"Start without any advancements, starting gear: Kiba tomahawk, Alpha armband, TUE pockets, Gamma secure container", 
					"Старт без прокачки чего-либо, снаряжение: томагавк Kiba, повязка Альфа, увеличенные карманы из TUE, подсумок Gamma", 
					"Edge Of Darkness", 
					"./preset_info/tue_standalone.json", 
					"./preset_info/tue_standalone.json"
				);
			}
		}			
		if (config.EnableAxemanEdition) 
		{
			if (config.UseUnheardItemsPreview)
			{
				this.createPreset(
					"The Axeman Edition", 
					"TT-HC", 
					"Start without any advancements, starting gear: Antique axe, Unheard armband, smaller pockets, 15k RUB, LIKE waist band", 
					"Старт без прокачки чего-либо, снаряжение: Антикварный топор, повязка Unheard, маленькие карманы, 15к RUB, поясная сумочка LIKE", 
					"Edge Of Darkness", 
					"./preset_info/hatchet.json", 
					"./preset_info/hatchet.json"
				);
			}
			else
			{
				this.createPreset(
					"The Axeman Edition", 
					"TT-HC", 
					"Start without any advancements, starting gear: Antique axe, smaller pockets, 15k RUB, LIKE waist band", 
					"Старт без прокачки чего-либо, снаряжение: Антикварный топор, маленькие карманы, 15к RUB, поясная сумочка LIKE", 
					"Edge Of Darkness", 
					"./preset_info/hatchet_standalone.json", 
					"./preset_info/hatchet_standalone.json"
				);
			}
		}
		if (config.EnableBossEdition)
		{
			this.createPreset(
				"The BOSS Edition", 
				"BOSS-HC", 
				"Start without any advancements, starting gear: Taiga, DEADSKUL armband, gigantic pockets, 1kk RUB, Kappa secure container", 
				"Старт без прокачки чего-либо, снаряжение: Тайга, повязка DEADSKUL, гигантские карманы, 1кк RUB, подсумок Kappa", 
				"Edge Of Darkness", 
				"./preset_info/boss.json", 
				"./preset_info/boss.json"
			);
		}
		
		if (config.RemoveSPTEditions) {
			this.removeBasePresets(config.EditionsToRemove);
		}
		
		this.logger.log(`Additional Profile Presets by BoT loaded!`, "green");
	
    }
	
	private addPockets(): void
	{
		for (const newItem in this.mydb.pockets)
        {
			let result = this.cloneItem(this.mydb.pockets[newItem].clone, newItem);
        }
	}
	
	private removeBasePresets(profileNames: string[] = ["Standard", "Left Behind", "Prepare To Escape", "Edge Of Darkness", "SPT Developer", "SPT Easy start", "SPT Zero to hero"]): void 
	{
		for (const profileName of profileNames) {
			delete this.db.templates.profiles[profileName];
		}
	}
	
	private createPreset(	profileName: string, 
							localeKey: string, 
							localeValueEN: string, 
							localeValueRU: string, 
							sourceProfileName: string, 
							bearInventoryDirectory: string, 
							usecInventoryDirectory: string
						): void 
	{
		let profileToAdd = this.clonePreset(sourceProfileName, profileName);
		
		let bearInventoryData = JSON.parse(readFileSync(join(__dirname, bearInventoryDirectory), "utf-8"))
        let usecInventoryData = JSON.parse(readFileSync(join(__dirname, usecInventoryDirectory), "utf-8"))
		
		profileToAdd.bear.character.Inventory = bearInventoryData;
        profileToAdd.usec.character.Inventory = usecInventoryData;
		
		this.db.templates.profiles[profileName] = profileToAdd;
	
		if (config.Language == "ru") {
			this.db.templates.profiles[profileName].descriptionLocaleKey = localeValueRU;
		}
		else if (config.Language == "en") {
			this.db.templates.profiles[profileName].descriptionLocaleKey = localeValueEN;
		}
		
		// Couldnt get it done properly for now... Not a pro in TS/JS... So I've done it via config
		/*
		let locale = "launcher-profile_".concat(localeKey.toString());
		this.db.templates.profiles[profileName].descriptionLocaleKey = locale;
		
		this.db.locales.server.ru[locale] = localeValueRU;
		this.db.locales.server.en[locale] = localeValueEN;
		// EITHER of these two should've worked as intended.
		Object.assign(this.db.locales.server.ru, {locale : localeValueRU});
		Object.assign(this.db.locales.server.en, {locale : localeValueEN});
		*/
	}
	
	private clonePreset(sourceId: string, targetId: string)
    {
		let result = this.jsonUtil.clone(this.db.templates.profiles[sourceId]);
		
		this.db.templates.profiles[targetId] = result;
		
		return result;
    }
	
	private cloneItem(sourceId: string, targetId: string)
    {
		let result = this.jsonUtil.clone(this.db.templates.items[sourceId]);
		
		result._id = targetId;
		result = this.compareAndReplace(result, this.mydb.pockets[targetId]["items"]);
		
		this.db.templates.items[targetId] = result;
		
		return result;
    }
	
	private compareAndReplace(targetItem, sourceItem)
    {
        for (const key in sourceItem)
        {
			if ( (["boolean", "string", "number"].includes(typeof sourceItem[key])) || Array.isArray(sourceItem[key]) )
			{
				if ( key in targetItem ) targetItem[key] = sourceItem[key];
				else this.logger.error("There was an error finding the attribute: \"" + key + "\", using default value instead.");
			} 
			else targetItem[key] = this.compareAndReplace(targetItem[key], sourceItem[key]);
        }

        return targetItem;
    }
}

module.exports = { mod: new Mod() }