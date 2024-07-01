import { DependencyContainer } from "tsyringe";

import { IPostDBLoadMod } from "@spt-aki/models/external/IPostDBLoadMod";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { ConfigServer } from "@spt-aki/servers/ConfigServer";
import { ConfigTypes } from "@spt-aki/models/enums/ConfigTypes";
import { IInsuranceConfig } from "@spt-aki/models/spt/config/IInsuranceConfig";

class Mod implements IPostDBLoadMod
{
    private cfg = require("../config/config.json");

    public postDBLoad(container: DependencyContainer): void 
    {
        // get logger
        const logger = container.resolve<ILogger>("WinstonLogger");

        // get database from server
        const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");

        // get config server
        const configServer = container.resolve<ConfigServer>("ConfigServer");
        const insuranceConfig = configServer.getConfig<IInsuranceConfig>(ConfigTypes.INSURANCE);

        // Get all the in-memory json found in /assets/database
        const tables = databaseServer.getTables();

        // trader insurance return times
        for (const traderID in tables.traders)
		{
			const trader = tables.traders[traderID];
            if (("insurance" in trader.base) && trader.base.insurance.availability)
            {
				switch(traderID) 
				{
					case "54cb50c76803fa8b248b4571": // Prapor
						this.setInsuranceReturnTimeByMultiplier(trader, this.cfg.insuranceReturnMultiplier);
						this.setInsuranceReturnTimeByHour(trader, this.cfg.praporInsuranceMinReturnHour, this.cfg.praporInsuranceMaxReturnHour);
						this.setInsuranceStorageTimeByHour(trader, this.cfg.praporInsuranceMaxStorageTimeHour);
						break;
					
					case "54cb57776803fa99248b456e": // Therapist
						this.setInsuranceReturnTimeByMultiplier(trader, this.cfg.insuranceReturnMultiplier);
						this.setInsuranceReturnTimeByHour(trader, this.cfg.therapistInsuranceMinReturnHour, this.cfg.therapistInsuranceMaxReturnHour);
						this.setInsuranceStorageTimeByHour(trader, this.cfg.therapistInsuranceMaxStorageTimeHour);
						break;
					
					default:
						break;
				}
				
				if (this.cfg.showLogs)
					logger.info(`[WaitTimeMultipliers] Trader's ID: ${traderID}. Return min hr: ${trader.base.insurance.min_return_hour}. Return max hr: ${trader.base.insurance.max_return_hour}. Storage hr: ${trader.base.insurance.max_storage_time}.`);
            }
		}
		
        // insurance config
        if (this.cfg.setInsuranceCheckInterval && this.cfg.insuranceCheckIntervalInSec > 0)
        {
            insuranceConfig.runIntervalSeconds = this.cfg.insuranceCheckIntervalInSec;

            if (this.cfg.showLogs)
                logger.info(`[WaitTimeMultipliers] Insurance interval is ${insuranceConfig.runIntervalSeconds} seconds.`);
        }
        
        // insurance return chance
        if (this.cfg.setInsuranceReturnChance && (this.cfg.insuranceReturnChance >= 0) && (this.cfg.insuranceReturnChance <= 100))
        {
            insuranceConfig.returnChancePercent = this.cfg.insuranceReturnChance;
            
            if (this.cfg.showLogs)
                logger.info(`[WaitTimeMultipliers] Insurance return chance is ${insuranceConfig.returnChancePercent}%.`);
        }

        // construction times
		for (const area of tables.hideout.areas)
		{
			for (const stage in area.stages)
			{
				if (this.cfg.setHideoutConstructionTime && (this.cfg.hideoutConstructionTimeMultiplier >= 0))
					area.stages[stage].constructionTime *= (1 - this.cfg.hideoutConstructionTimeMultiplier);
				
				// graphics card slots
				if (this.cfg.setHideoutBitcoinSlot && (this.cfg.hideoutBitcoinSlotMultiplier >= 1) && (area.type === 20) && (stage != "0"))
				{
					area.stages[stage].bonuses[0].value *= this.cfg.hideoutBitcoinSlotMultiplier;
					
					if (this.cfg.showLogs)
						logger.info(`[WaitTimeMultipliers] Bitcoin farm level ${stage} bonus changed to ${area.stages[stage].bonuses[0].value}`);
				}
			}
		}
		
		// crafting times
		if (this.cfg.setHideoutProductionTime) 
		{
		    for (const product of tables.hideout.production)
			{
				const ovr = this.cfg.hideoutProductionOverrides.find((x: { recipeId: string; }) => x.recipeId === product._id);
				if (ovr)
				{
					if (ovr.time >= 2)
					{
						product.productionTime = ovr.time;
						if (this.cfg.showLogs)
							logger.info(`[WaitTimeMultipliers] Craft '${product.endProduct}' overridden to ${ovr.time} seconds`);
					}
					else if (this.cfg.showLogs)
						logger.info(`[WaitTimeMultipliers] Craft '${product.endProduct}' not modified`);
					
					continue;
				}
				
				if (this.cfg.hideoutProductionTimeMultiplier >= 0) 
					product.productionTime *= (1 - this.cfg.hideoutProductionTimeMultiplier);
			}
		}
		
        // scav case times
		if (this.cfg.setHideoutScavCaseTime) 
		{
			for (const scav of tables.hideout.scavcase)
			{
				const ovr = this.cfg.hideoutScavCaseOverrides.find((x: { recipeId: string; }) => x.recipeId === scav._id);
				if (ovr)
				{
					if (ovr.time >= 0)
					{
						scav.ProductionTime = ovr.time;
						if (this.cfg.showLogs)
							logger.info(`[WaitTimeMultipliers] Scav '${scav._id}' overridden to ${ovr.time} seconds`);
					}
					else if (this.cfg.showLogs)
						logger.info(`[WaitTimeMultipliers] Scav '${scav._id}' not modified`);
						
					continue;
				}
				
				if (this.cfg.hideoutScavCaseTimeMultiplier >= 0)
					scav.ProductionTime *= (1 - this.cfg.hideoutScavCaseTimeMultiplier);
			}
		}
        
        // scav cooldown
        if (this.cfg.setScavCooldown && (this.cfg.scavCooldownInSec >= 0))
        {
            tables.globals.config.SavagePlayCooldown = this.cfg.scavCooldownInSec;
			
			if (this.cfg.showLogs)
				logger.info(`[WaitTimeMultipliers] Scav cooldown set to ${tables.globals.config.SavagePlayCooldown} seconds`);
        }
    }
	
	private setInsuranceStorageTimeByHour(trader: Trader, timelimit: number) 
	{
		if (!this.cfg.setInsuranceStorageTime)
			return;
		
		if (timelimit >= 0) 
			trader.base.insurance.max_storage_time = timelimit;
	}
	
	private setInsuranceReturnTimeByMultiplier(trader: Trader, multiplier: number): void {
		if (!this.cfg.useInsuranceReturnMultiplier || !this.cfg.setInsuranceReturnTime)
			return;
	
		if (multiplier >= 0)
		{
			let minHr: number = trader.base.insurance.min_return_hour *= (1 - multiplier);
			let maxHr: number = trader.base.insurance.max_return_hour *= (1 - multiplier);
			trader.base.insurance.min_return_hour = Math.round(minHr);
			trader.base.insurance.max_return_hour = Math.round(maxHr);
		}
	}
	
	private setInsuranceReturnTimeByHour(trader: Trader, minReturnHour: number, maxReturnHour: number): void {
		if (this.cfg.useInsuranceReturnMultiplier || !this.cfg.setInsuranceReturnTime)
			return;
	
		if ((minReturnHour >= 0) && (maxReturnHour>= 0) && (maxReturnHour >= minReturnHour)) 
		{
			trader.base.insurance.min_return_hour = minReturnHour;
			trader.base.insurance.max_return_hour = maxReturnHour;
		}
	}
}

module.exports = { mod: new Mod() }
